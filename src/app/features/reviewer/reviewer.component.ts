import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import {
  Component,
  OnInit,
  ViewEncapsulation,
  inject,
  signal,
} from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';

import {
  ApiResponse,
  Application,
  ConfirmAction,
  CurrentUser,
  Review,
  ReviewDecision,
  ReviewSubmissionResponse,
  ReviewerOption,
} from './models/reviewer.model';

import { ReviewHeaderComponent } from './components/review-header/review-header.component';
import { ApplicationDetailsComponent } from './components/application-details/application-details.component';
import { ReviewHistoryComponent } from './components/review-history/review-history.component';
import { ReviewerAssignmentComponent } from './components/reviewer-assignment/reviewer-assignment.component';
import { ReviewDecisionComponent } from './components/review-decision/review-decision.component';
import { ConfirmationModalComponent } from './components/confirmation-modal/confirmation-modal.component';

@Component({
  selector: 'app-reviewer',
  standalone: true,
  imports: [
    CommonModule,
    ReviewHeaderComponent,
    ApplicationDetailsComponent,
    ReviewHistoryComponent,
    ReviewerAssignmentComponent,
    ReviewDecisionComponent,
    ConfirmationModalComponent,
  ],
  templateUrl: './reviewer.component.html',
  styleUrl: './reviewer.component.css',

  // Keeps the existing reviewer.component.css selectors working
  // after their matching markup is moved into child templates.
  encapsulation: ViewEncapsulation.None,
})
export class ReviewerComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);

  private readonly apiUrl = 'http://localhost:3000/api/applications';
  private readonly authUrl = 'http://localhost:3000';

  readonly application = signal<Application | null>(null);
  readonly currentUser = signal<CurrentUser | null>(null);
  readonly reviews = signal<Review[]>([]);
  readonly reviewers = signal<ReviewerOption[]>([]);

  readonly loading = signal(true);
  readonly loadingReviews = signal(false);
  readonly loadingReviewers = signal(false);
  readonly savingAssignment = signal(false);
  readonly submitting = signal(false);

  readonly error = signal('');
  readonly success = signal('');

  readonly showConfirmModal = signal(false);
  readonly confirmTitle = signal('');
  readonly confirmMessage = signal('');
  readonly confirmAction = signal<ConfirmAction | null>(null);

  readonly reviewForm = this.fb.nonNullable.group({
    decision: this.fb.nonNullable.control<ReviewDecision>(
      'APPROVE',
      Validators.required,
    ),
    comments: this.fb.nonNullable.control('', [Validators.maxLength(2000)]),
  });

  readonly assignmentForm = this.fb.nonNullable.group({
    reviewerId: this.fb.nonNullable.control(''),
  });

  private applicationId = '';

  ngOnInit(): void {
    this.applicationId = this.route.snapshot.paramMap.get('id') ?? '';

    if (!this.applicationId) {
      this.loading.set(false);
      this.error.set('An application ID is required.');
      return;
    }

    this.loadCurrentUser();
  }

  canReview(): boolean {
    const role = this.currentUser()?.role;
    return role === 'ADMIN' || role === 'REVIEWER';
  }

  private loadCurrentUser(): void {
    this.http.get<CurrentUser>(`${this.authUrl}/me`).subscribe({
      next: (user) => {
        this.currentUser.set(user);

        if (user.role !== 'ADMIN' && user.role !== 'REVIEWER') {
          this.loading.set(false);
          this.error.set(
            'Access denied. Only admins and reviewers can use this page.',
          );
          return;
        }

        this.loadApplication();

        if (user.role === 'ADMIN') {
          this.loadReviewers();
        }
      },
      error: (err) => {
        this.loading.set(false);

        if (err.status === 401) {
          this.error.set('Your session has expired. Please log in again.');
        } else {
          this.error.set('Unable to verify your user account.');
        }
      },
    });
  }

  private loadApplication(): void {
    this.loading.set(true);
    this.error.set('');

    this.http
      .get<Application>(
        `${this.apiUrl}/${encodeURIComponent(this.applicationId)}`,
      )
      .subscribe({
        next: (application) => {
          this.application.set(application);

          this.assignmentForm.controls.reviewerId.setValue(
            application.assigned_reviewer_id ?? application.reviewer_id ?? '',
          );

          this.loading.set(false);
          this.loadReviews();
        },
        error: (err) => {
          this.loading.set(false);

          if (err.status === 401) {
            this.error.set('Your session has expired. Please log in again.');
          } else if (err.status === 404) {
            this.error.set(
              'Application not found, or you do not have permission to access it.',
            );
          } else {
            this.error.set('Failed to load application details.');
          }
        },
      });
  }

  private loadReviewers(): void {
    this.loadingReviewers.set(true);

    this.http
      .get<
        ApiResponse<ReviewerOption[]> | ReviewerOption[]
      >(`${this.authUrl}/api/users?role=REVIEWER`)
      .subscribe({
        next: (response) => {
          const users = Array.isArray(response) ? response : response.data;

          this.reviewers.set(
            (users ?? []).filter((user) => user.role === 'REVIEWER'),
          );

          this.loadingReviewers.set(false);
        },
        error: () => {
          this.loadingReviewers.set(false);
          this.error.set(
            'Unable to load reviewers. Check that GET /api/users?role=REVIEWER is implemented.',
          );
        },
      });
  }

  selectedReviewerUnchanged(): boolean {
    const app = this.application();

    if (!app) return true;

    const currentId = app.assigned_reviewer_id ?? app.reviewer_id ?? '';

    return this.assignmentForm.controls.reviewerId.value === currentId;
  }

  private openConfirmation(
    title: string,
    message: string,
    action: ConfirmAction,
  ): void {
    this.confirmTitle.set(title);
    this.confirmMessage.set(message);
    this.confirmAction.set(action);
    this.showConfirmModal.set(true);
  }

  cancelConfirmation(): void {
    if (this.savingAssignment() || this.submitting()) return;

    this.showConfirmModal.set(false);
    this.confirmAction.set(null);
  }

  confirmActionNow(): void {
    if (this.savingAssignment() || this.submitting()) return;

    const action = this.confirmAction();

    if (!action) return;

    this.showConfirmModal.set(false);
    this.confirmAction.set(null);

    if (action === 'REASSIGN') {
      this.saveReviewerAssignment();
    } else {
      this.saveReviewDecision();
    }
  }

  reassignReviewer(): void {
    if (
      this.currentUser()?.role !== 'ADMIN' ||
      this.savingAssignment() ||
      this.assignmentForm.invalid ||
      this.selectedReviewerUnchanged()
    ) {
      return;
    }

    const reviewerId = this.assignmentForm.controls.reviewerId.value || null;

    const reviewer = this.reviewers().find((item) => item.id === reviewerId);

    const newReviewerName = reviewer
      ? this.reviewerDisplayName(reviewer)
      : 'Unassigned';

    this.openConfirmation(
      'Confirm Reviewer Assignment',
      `Reassign this application to ${newReviewerName}?`,
      'REASSIGN',
    );
  }

  private saveReviewerAssignment(): void {
    if (this.currentUser()?.role !== 'ADMIN' || this.savingAssignment()) {
      return;
    }

    const reviewerId = this.assignmentForm.controls.reviewerId.value || null;

    const reviewer = this.reviewers().find((item) => item.id === reviewerId);

    const newReviewerName = reviewer
      ? this.reviewerDisplayName(reviewer)
      : 'Unassigned';

    this.savingAssignment.set(true);
    this.error.set('');
    this.success.set('');

    this.http
      .patch<
        ApiResponse<Application> | Application
      >(`${this.apiUrl}/${encodeURIComponent(this.applicationId)}`, { assigned_reviewer_id: reviewerId })
      .subscribe({
        next: (response) => {
          const updatedApplication =
            'data' in response ? response.data : response;

          this.application.set(updatedApplication);

          this.assignmentForm.controls.reviewerId.setValue(
            updatedApplication.assigned_reviewer_id ??
              updatedApplication.reviewer_id ??
              '',
          );

          this.savingAssignment.set(false);
          this.success.set(
            reviewer
              ? `Reviewer reassigned to ${newReviewerName}.`
              : 'Reviewer assignment removed.',
          );
        },
        error: (err) => {
          this.savingAssignment.set(false);

          if (err.status === 401) {
            this.error.set('Your session has expired. Please log in again.');
          } else if (err.status === 403) {
            this.error.set('Only administrators can reassign reviewers.');
          } else if (err.status === 404) {
            this.error.set(
              'Application or reviewer not found. Verify the API endpoints.',
            );
          } else if (err.status === 400) {
            this.error.set(
              err.error?.message || 'The reviewer assignment is invalid.',
            );
          } else {
            this.error.set(
              err.error?.message ||
                'Failed to reassign the reviewer. Please try again.',
            );
          }
        },
      });
  }

  loadReviews(): void {
    if (!this.application()) return;

    this.loadingReviews.set(true);

    this.http
      .get<
        ApiResponse<Review[]>
      >(`${this.apiUrl}/${encodeURIComponent(this.applicationId)}/reviews`)
      .subscribe({
        next: (response) => {
          this.reviews.set(response.data ?? []);
          this.loadingReviews.set(false);
        },
        error: (err) => {
          this.loadingReviews.set(false);

          if (err.status === 401) {
            this.error.set('Your session has expired. Please log in again.');
          } else {
            this.error.set(
              'Unable to load review history. Confirm that the reviews API endpoint is implemented.',
            );
          }
        },
      });
  }

  submitReview(): void {
    if (!this.canReview() || this.reviewForm.invalid || this.submitting()) {
      this.reviewForm.markAllAsTouched();
      return;
    }

    const decision = this.reviewForm.controls.decision.value;
    const comments = this.reviewForm.controls.comments.value.trim();

    if (decision === 'REJECT' && !comments) {
      this.error.set('Please provide comments explaining the rejection.');
      this.reviewForm.controls.comments.markAsTouched();
      return;
    }

    if (decision === 'REQUEST_INFO' && !comments) {
      this.error.set('Please specify what additional information is required.');
      this.reviewForm.controls.comments.markAsTouched();
      return;
    }

    const decisionLabels: Record<ReviewDecision, string> = {
      APPROVE: 'approve',
      REJECT: 'reject',
      REQUEST_INFO: 'request additional information for',
    };

    this.openConfirmation(
      'Confirm Review Decision',
      `Are you sure you want to ${decisionLabels[decision]} this application?`,
      'REVIEW',
    );
  }

  private saveReviewDecision(): void {
    if (!this.canReview() || this.reviewForm.invalid || this.submitting()) {
      return;
    }

    const decision = this.reviewForm.controls.decision.value;
    const comments = this.reviewForm.controls.comments.value.trim();

    if ((decision === 'REJECT' || decision === 'REQUEST_INFO') && !comments) {
      this.error.set(
        decision === 'REJECT'
          ? 'Please provide comments explaining the rejection.'
          : 'Please specify what additional information is required.',
      );
      this.reviewForm.controls.comments.markAsTouched();
      return;
    }

    this.submitting.set(true);
    this.error.set('');
    this.success.set('');

    this.http
      .post<ReviewSubmissionResponse>(
        `${this.apiUrl}/${encodeURIComponent(this.applicationId)}/reviews`,
        { decision, comments },
      )
      .subscribe({
        next: (response) => {
          this.application.set(response.data);

          if (response.review) {
            this.reviews.update((items) => [
              response.review,
              ...items.filter((item) => item.id !== response.review.id),
            ]);
          }

          this.submitting.set(false);
          this.success.set(
            response.message || 'Review decision submitted successfully.',
          );

          this.reviewForm.reset({
            decision: 'APPROVE',
            comments: '',
          });

          this.loadReviews();
        },
        error: (err) => {
          this.submitting.set(false);

          if (err.status === 401) {
            this.error.set('Your session has expired. Please log in again.');
          } else if (err.status === 403) {
            this.error.set(
              'You are not permitted to submit this review decision.',
            );
          } else if (err.status === 404) {
            this.error.set(
              'Application not found, or you are not assigned to review it.',
            );
          } else if (err.status === 400) {
            this.error.set(
              err.error?.message || 'The review decision is invalid.',
            );
          } else {
            this.error.set(
              err.error?.message || 'Failed to submit the review decision.',
            );
          }
        },
      });
  }

  private reviewerDisplayName(reviewer: ReviewerOption): string {
    const suppliedName = reviewer.name?.trim();

    if (suppliedName) return suppliedName;

    const fullName = [reviewer.first_name, reviewer.last_name]
      .filter(Boolean)
      .join(' ')
      .trim();

    return fullName || reviewer.email || reviewer.id;
  }
}
