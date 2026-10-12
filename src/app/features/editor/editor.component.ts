import { DOCUMENT } from '@angular/common';
import {
  Component,
  input,
  output,
  OnInit,
  OnDestroy,
  Renderer2,
  inject,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, Observable, of } from 'rxjs';
import {
  catchError,
  concatMap,
  debounceTime,
  map,
  takeUntil,
} from 'rxjs/operators';

import {
  type EditorRole,
  type EditorMode,
  type DraftSaveStatus,
  type ReviewerOption,
  type MerchantApplication,
  type ApplicationApiResponse,
  type SaveRequest,
  type SaveQueueResult,
} from './models/editor.model';

import { EditorProgressComponent } from './components/editor-progress/editor-progress.component';
import { BusinessStepComponent } from './components/business-step/business-step.component';
import { OwnerProcessingStepComponent } from './components/owner-processing-step/owner-processing-step.component';
import { ReviewStepComponent } from './components/review-step/review-step.component';
import { EditorActionsComponent } from './components/editor-actions/editor-actions.component';

@Component({
  selector: 'app-editor',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    EditorProgressComponent,
    BusinessStepComponent,
    OwnerProcessingStepComponent,
    ReviewStepComponent,
    EditorActionsComponent,
  ],
  templateUrl: './editor.component.html',
  styleUrl: './editor.component.css',
})
export class EditorComponent implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly http = inject(HttpClient);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly renderer = inject(Renderer2);
  private readonly document = inject(DOCUMENT);

  private readonly apiUrl = 'http://localhost:3000/api/applications';

  private readonly destroy$ = new Subject<void>();
  private readonly autoSaveTriggers$ = new Subject<void>();
  private readonly saveRequests$ = new Subject<SaveRequest>();

  private submitting = false;

  readonly role = input<EditorRole>('SALES');
  readonly reviewers = input<ReviewerOption[]>([]);

  readonly saved = output<MerchantApplication>();
  readonly draftSaved = output<MerchantApplication>();
  readonly cancel = output<void>();

  mode: EditorMode = 'add';
  applicationId: string | null = null;
  initialData: Partial<MerchantApplication> | null = null;

  currentStep = 0;
  saving = false;
  loading = false;
  errorMessage = '';
  successMessage = '';

  autoSaveStatus: DraftSaveStatus = 'idle';
  autoSaveError = '';

  readonly steps = ['Business', 'Owner & Processing', 'Review'];
  readonly totalSteps = this.steps.length;

  readonly businessTypes = [
    'SOLE_PROPRIETORSHIP',
    'CORPORATION',
    'PARTNERSHIP',
    'PRIVATE_LIMITED_COMPANY',
    'PUBLIC_LIMITED_COMPANY',
    'NON_PROFIT',
    'OTHER',
  ];

  readonly currencies = ['USD', 'EUR', 'GBP', 'NPR', 'INR', 'AUD', 'CAD'];

  readonly applicationStatuses = [
    'DRAFT',
    'PENDING',
    'IN_REVIEW',
    'APPROVED',
    'REJECTED',
  ];

  readonly riskStatuses = ['PENDING', 'LOW', 'MEDIUM', 'HIGH', 'REJECTED'];

  readonly form = this.fb.group({
    business_name: ['', Validators.required],
    legal_business_name: ['', Validators.required],
    business_type: ['', Validators.required],

    owner_name: ['', Validators.required],
    owner_email: ['', [Validators.required, Validators.email]],
    owner_phone: ['', Validators.required],

    processing_volume: this.fb.control<number | null>(null, [
      Validators.required,
      Validators.min(0),
    ]),
    processing_currency: ['', Validators.required],

    application_status: ['DRAFT', Validators.required],
    risk_status: ['PENDING', Validators.required],

    reviewer_id: [''],
  });

  ngOnInit(): void {
    this.setupAutoSave();
    this.setupSaveQueue();

    this.form.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
      if (!this.loading && !this.submitting) {
        this.autoSaveStatus = 'idle';
        this.autoSaveError = '';
        this.autoSaveTriggers$.next();
      }
    });

    this.applicationId = this.route.snapshot.paramMap.get('id');
    this.mode = this.applicationId ? 'edit' : 'add';

    if (this.applicationId) {
      this.loadApplication(this.applicationId);
    } else {
      this.resetForm();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();

    this.autoSaveTriggers$.complete();
    this.saveRequests$.complete();
  }

  private setupAutoSave(): void {
    this.autoSaveTriggers$
      .pipe(debounceTime(800), takeUntil(this.destroy$))
      .subscribe(() => {
        if (this.loading || this.submitting || !this.hasDraftContent()) {
          return;
        }

        this.saveRequests$.next({
          isDraft: true,
          auto: true,
        });
      });
  }

  private setupSaveQueue(): void {
    this.saveRequests$
      .pipe(
        concatMap((request) => this.executeSave(request)),
        takeUntil(this.destroy$),
      )
      .subscribe((result) => {
        this.saving = false;

        if (!result.application) {
          if (result.error !== null) {
            const message = this.getErrorMessage(
              result.error,
              result.request.auto
                ? 'Auto-save failed. Your form values are preserved.'
                : 'Failed to save the application.',
            );

            if (result.request.auto) {
              this.autoSaveStatus = 'error';
              this.autoSaveError = message;
            } else {
              this.errorMessage = message;

              if (!result.request.isDraft) {
                this.submitting = false;
              }
            }
          }

          return;
        }

        const application = result.application;
        const wasEdit = this.mode === 'edit';

        this.initialData = application;

        if (application.id) {
          this.applicationId = application.id;
          this.mode = 'edit';
        }

        if (result.request.auto) {
          this.autoSaveStatus = 'saved';
          this.autoSaveError = '';
          return;
        }

        if (result.request.isDraft) {
          this.draftSaved.emit(application);
          this.successMessage = 'Draft saved successfully.';
          this.autoSaveStatus = 'saved';
          this.autoSaveError = '';
          return;
        }

        this.saved.emit(application);

        const message = wasEdit
          ? 'Application updated successfully.'
          : 'Application created successfully.';

        this.successMessage = message;
        this.showGlobalSuccessNotification(message);

        void this.router.navigate(['/applications']);
      });
  }

  private executeSave(request: SaveRequest): Observable<SaveQueueResult> {
    if (this.loading) {
      return of({
        request,
        application: null,
        error: null,
      });
    }

    this.saving = true;

    if (request.auto) {
      this.autoSaveStatus = 'saving';
      this.autoSaveError = '';
    } else {
      this.errorMessage = '';
      this.successMessage = '';
    }

    const payload = this.buildPayload();

    const request$: Observable<ApplicationApiResponse> = this.applicationId
      ? this.http.put<ApplicationApiResponse>(
          `${this.apiUrl}/${encodeURIComponent(this.applicationId)}`,
          payload,
        )
      : this.http.post<ApplicationApiResponse>(this.apiUrl, payload);

    return request$.pipe(
      map((response) => this.unwrapApplication(response)),
      map((response) => {
        const application: MerchantApplication = {
          ...payload,
          ...response,
          id: response.id ?? payload.id ?? this.applicationId ?? undefined,
        };

        return {
          request,
          application,
          error: null,
        } satisfies SaveQueueResult;
      }),
      catchError((error: unknown) =>
        of({
          request,
          application: null,
          error,
        } satisfies SaveQueueResult),
      ),
    );
  }

  private unwrapApplication(
    response: ApplicationApiResponse,
  ): MerchantApplication {
    if ('data' in response && response.data) {
      return response.data;
    }

    return response as MerchantApplication;
  }

  private loadApplication(id: string): void {
    this.loading = true;
    this.errorMessage = '';

    this.http
      .get<ApplicationApiResponse>(`${this.apiUrl}/${encodeURIComponent(id)}`)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          const application = this.unwrapApplication(response);

          this.initialData = application;
          this.patchForm(application);
          this.loading = false;
        },
        error: (error: unknown) => {
          this.loading = false;
          this.errorMessage = this.getErrorMessage(
            error,
            'Failed to load the application.',
          );
        },
      });
  }

  private resetForm(): void {
    this.initialData = null;

    this.form.reset(
      {
        business_name: '',
        legal_business_name: '',
        business_type: '',
        owner_name: '',
        owner_email: '',
        owner_phone: '',
        processing_volume: null,
        processing_currency: '',
        application_status: 'DRAFT',
        risk_status: 'PENDING',
        reviewer_id: '',
      },
      { emitEvent: false },
    );
  }

  private patchForm(application: Partial<MerchantApplication>): void {
    this.form.reset(
      {
        business_name: application.business_name ?? '',
        legal_business_name: application.legal_business_name ?? '',
        business_type: application.business_type ?? '',
        owner_name: application.owner_name ?? '',
        owner_email: application.owner_email ?? '',
        owner_phone: application.owner_phone ?? '',
        processing_volume: application.processing_volume ?? null,
        processing_currency: application.processing_currency ?? '',
        application_status: application.application_status ?? 'DRAFT',
        risk_status: application.risk_status ?? 'PENDING',
        reviewer_id: application.reviewer_id ?? '',
      },
      { emitEvent: false },
    );

    this.currentStep = 0;
    this.autoSaveStatus = 'idle';
    this.autoSaveError = '';
  }

  private hasDraftContent(): boolean {
    const value = this.form.getRawValue();

    const fields = [
      value.business_name,
      value.legal_business_name,
      value.business_type,
      value.owner_name,
      value.owner_email,
      value.owner_phone,
      value.processing_currency,
    ];

    return (
      fields.some(
        (field) => typeof field === 'string' && field.trim() !== '',
      ) || value.processing_volume !== null
    );
  }

  retryAutoSave(): void {
    if (this.saving || this.loading || !this.hasDraftContent()) {
      return;
    }

    this.autoSaveError = '';
    this.autoSaveStatus = 'idle';

    this.saveRequests$.next({
      isDraft: true,
      auto: true,
    });
  }

  canAssignReviewer(): boolean {
    return this.role() === 'ADMIN';
  }

  canManageStatus(): boolean {
    return this.role() === 'ADMIN' || this.role() === 'REVIEWER';
  }

  hasError(field: keyof typeof this.form.controls): boolean {
    const control = this.form.controls[field];
    return control.invalid && (control.touched || control.dirty);
  }

  nextStep(): void {
    const fieldsByStep: string[][] = [
      ['business_name', 'legal_business_name', 'business_type'],
      [
        'owner_name',
        'owner_email',
        'owner_phone',
        'processing_volume',
        'processing_currency',
      ],
    ];

    const fields = fieldsByStep[this.currentStep] ?? [];

    for (const field of fields) {
      this.form.get(field)?.markAsTouched();
    }

    if (fields.some((field) => this.form.get(field)?.invalid)) {
      return;
    }

    if (this.currentStep < this.totalSteps - 1) {
      this.currentStep++;
    }
  }

  previousStep(): void {
    if (this.currentStep > 0) {
      this.currentStep--;
    }
  }

  private buildPayload(): MerchantApplication {
    const value = this.form.getRawValue();

    const payload: MerchantApplication = {
      business_name: value.business_name ?? '',
      legal_business_name: value.legal_business_name ?? '',
      business_type: value.business_type ?? '',
      owner_name: value.owner_name ?? '',
      owner_email: value.owner_email ?? '',
      owner_phone: value.owner_phone ?? '',
      processing_volume: value.processing_volume,
      processing_currency: value.processing_currency ?? '',

      application_status: this.canManageStatus()
        ? (value.application_status ?? 'DRAFT')
        : (this.initialData?.application_status ?? 'DRAFT'),

      risk_status: this.canManageStatus()
        ? (value.risk_status ?? 'PENDING')
        : (this.initialData?.risk_status ?? 'PENDING'),

      reviewer_id: this.canAssignReviewer()
        ? value.reviewer_id || null
        : (this.initialData?.reviewer_id ?? null),
    };

    if (this.applicationId) {
      payload.id = this.applicationId;
    }

    return payload;
  }

  saveDraft(): void {
    if (this.saving || this.loading) {
      return;
    }

    if (this.canManageStatus()) {
      this.form.controls.application_status.setValue('DRAFT', {
        emitEvent: false,
      });
    }

    this.saveRequests$.next({
      isDraft: true,
      auto: false,
    });
  }

  submit(): void {
    if (
      this.currentStep !== this.totalSteps - 1 ||
      this.saving ||
      this.loading
    ) {
      return;
    }

    this.form.markAllAsTouched();

    if (this.form.invalid) {
      if (
        this.form.controls.business_name.invalid ||
        this.form.controls.legal_business_name.invalid ||
        this.form.controls.business_type.invalid
      ) {
        this.currentStep = 0;
      } else if (
        this.form.controls.owner_name.invalid ||
        this.form.controls.owner_email.invalid ||
        this.form.controls.owner_phone.invalid ||
        this.form.controls.processing_volume.invalid ||
        this.form.controls.processing_currency.invalid
      ) {
        this.currentStep = 1;
      }

      return;
    }

    this.submitting = true;

    // The final save is queued behind any already-running auto-save.
    this.saveRequests$.next({
      isDraft: false,
      auto: false,
    });
  }

  close(): void {
    if (this.saving) {
      return;
    }

    this.cancel.emit();
    void this.router.navigate(['/applications']);
  }

  private showGlobalSuccessNotification(message: string): void {
    const body = this.document.body;

    if (!body) {
      return;
    }

    const toast = this.renderer.createElement('div') as HTMLElement;
    const icon = this.renderer.createElement('span') as HTMLElement;
    const text = this.renderer.createElement('span') as HTMLElement;

    this.renderer.setAttribute(toast, 'role', 'status');
    this.renderer.setAttribute(toast, 'aria-live', 'polite');
    this.renderer.setAttribute(toast, 'aria-atomic', 'true');

    const styles: Record<string, string> = {
      position: 'fixed',
      top: '24px',
      right: '24px',
      'z-index': '99999',
      display: 'flex',
      'align-items': 'center',
      gap: '12px',
      'max-width': 'calc(100vw - 32px)',
      padding: '16px 20px',
      background: '#ffffff',
      color: '#166534',
      border: '1px solid #bbf7d0',
      'border-left': '5px solid #16a34a',
      'border-radius': '10px',
      'box-shadow': '0 8px 24px rgba(0, 0, 0, 0.14)',
      'font-family': 'inherit',
      'font-size': '14px',
      'font-weight': '500',
    };

    for (const [property, value] of Object.entries(styles)) {
      this.renderer.setStyle(toast, property, value);
    }

    this.renderer.setStyle(icon, 'display', 'inline-flex');
    this.renderer.setStyle(icon, 'align-items', 'center');
    this.renderer.setStyle(icon, 'justify-content', 'center');
    this.renderer.setStyle(icon, 'width', '24px');
    this.renderer.setStyle(icon, 'height', '24px');
    this.renderer.setStyle(icon, 'flex-shrink', '0');
    this.renderer.setStyle(icon, 'border-radius', '50%');
    this.renderer.setStyle(icon, 'background', '#dcfce7');
    this.renderer.setStyle(icon, 'color', '#15803d');
    this.renderer.setStyle(icon, 'font-size', '16px');
    this.renderer.setStyle(icon, 'font-weight', '700');
    this.renderer.setStyle(text, 'line-height', '1.5');

    this.renderer.appendChild(icon, this.renderer.createText('✓'));
    this.renderer.appendChild(text, this.renderer.createText(message));
    this.renderer.appendChild(toast, icon);
    this.renderer.appendChild(toast, text);
    this.renderer.appendChild(body, toast);

    setTimeout(() => {
      if (toast.parentNode === body) {
        this.renderer.removeChild(body, toast);
      }
    }, 5000);
  }

  private getErrorMessage(error: unknown, fallback: string): string {
    if (typeof error === 'object' && error !== null && 'error' in error) {
      const apiError = (error as { error?: { message?: string } | string })
        .error;

      if (typeof apiError === 'string' && apiError) {
        return apiError;
      }

      if (
        typeof apiError === 'object' &&
        apiError !== null &&
        'message' in apiError &&
        typeof apiError.message === 'string'
      ) {
        return apiError.message;
      }
    }

    if (
      typeof error === 'object' &&
      error !== null &&
      'message' in error &&
      typeof error.message === 'string'
    ) {
      return error.message;
    }

    return fallback;
  }

  formatType(type: string): string {
    return type
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(/\b\w/g, (char) => char.toUpperCase());
  }
}
