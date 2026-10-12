import 'zone.js';
import 'zone.js/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';

import { EditorComponent } from './editor.component';

describe('EditorComponent', () => {
  let fixture: ComponentFixture<EditorComponent>;
  let component: EditorComponent;
  let httpMock: HttpTestingController;
  let router: { navigate: ReturnType<typeof vi.fn> };

  const apiUrl = 'http://localhost:3000/api/applications';

  function fillValidForm(): void {
    component.form.patchValue({
      business_name: 'Example Business',
      legal_business_name: 'Example Business Ltd',
      business_type: 'CORPORATION',
      owner_name: 'Alex Smith',
      owner_email: 'alex@example.com',
      owner_phone: '123456789',
      processing_volume: 1000,
      processing_currency: 'USD',
    });
  }

  beforeEach(async () => {
    router = {
      navigate: vi.fn().mockResolvedValue(true),
    };

    await TestBed.configureTestingModule({
      imports: [EditorComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: convertToParamMap({}),
            },
          },
        },
        {
          provide: Router,
          useValue: router,
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EditorComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);

    fixture.detectChanges();
  });

  afterEach(() => {
    httpMock.verify();
    fixture.destroy();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize in add mode', () => {
    expect(component.mode).toBe('add');
    expect(component.applicationId).toBeNull();
    expect(component.currentStep).toBe(0);
  });

  it('should define three editor steps', () => {
    expect(component.steps).toEqual([
      'Business',
      'Owner & Processing',
      'Review',
    ]);
    expect(component.totalSteps).toBe(3);
  });

  it('should allow only admins to assign reviewers', () => {
    fixture.componentRef.setInput('role', 'ADMIN');
    expect(component.canAssignReviewer()).toBe(true);

    fixture.componentRef.setInput('role', 'SALES');
    expect(component.canAssignReviewer()).toBe(false);

    fixture.componentRef.setInput('role', 'REVIEWER');
    expect(component.canAssignReviewer()).toBe(false);
  });

  it('should allow admins and reviewers to manage status', () => {
    fixture.componentRef.setInput('role', 'ADMIN');
    expect(component.canManageStatus()).toBe(true);

    fixture.componentRef.setInput('role', 'REVIEWER');
    expect(component.canManageStatus()).toBe(true);

    fixture.componentRef.setInput('role', 'SALES');
    expect(component.canManageStatus()).toBe(false);
  });

  it('should initialize the form as invalid', () => {
    expect(component.form.invalid).toBe(true);
  });

  it('should become valid when all required fields are filled', () => {
    fillValidForm();

    expect(component.form.valid).toBe(true);
  });

  it('should detect invalid touched fields', () => {
    const control = component.form.controls.business_name;

    control.markAsTouched();

    expect(component.hasError('business_name')).toBe(true);
  });

  it('should not advance when business fields are invalid', () => {
    component.nextStep();

    expect(component.currentStep).toBe(0);
    expect(component.form.controls.business_name.touched).toBe(true);
    expect(component.form.controls.legal_business_name.touched).toBe(true);
    expect(component.form.controls.business_type.touched).toBe(true);
  });

  it('should advance to the next step when business fields are valid', () => {
    component.form.patchValue({
      business_name: 'Example Business',
      legal_business_name: 'Example Business Ltd',
      business_type: 'CORPORATION',
    });

    component.nextStep();

    expect(component.currentStep).toBe(1);
  });

  it('should not advance when owner and processing fields are invalid', () => {
    component.currentStep = 1;

    component.nextStep();

    expect(component.currentStep).toBe(1);
    expect(component.form.controls.owner_name.touched).toBe(true);
    expect(component.form.controls.owner_email.touched).toBe(true);
  });

  it('should advance to the review step when the form section is valid', () => {
    component.currentStep = 1;

    component.form.patchValue({
      owner_name: 'Alex Smith',
      owner_email: 'alex@example.com',
      owner_phone: '123456789',
      processing_volume: 1000,
      processing_currency: 'USD',
    });

    component.nextStep();

    expect(component.currentStep).toBe(2);
  });

  it('should move to the previous step', () => {
    component.currentStep = 2;

    component.previousStep();

    expect(component.currentStep).toBe(1);
  });

  it('should not move before the first step', () => {
    component.previousStep();

    expect(component.currentStep).toBe(0);
  });

  it('should not submit when not on the final step', () => {
    fillValidForm();
    component.currentStep = 1;

    component.submit();

    expect(component.saving).toBe(false);
    httpMock.expectNone(apiUrl);
  });

  it('should return to the business step when submission has invalid business fields', () => {
    component.currentStep = 2;

    component.submit();

    expect(component.currentStep).toBe(0);
    expect(component.form.controls.business_name.touched).toBe(true);
    httpMock.expectNone(apiUrl);
  });

  it('should return to the owner step when only owner fields are invalid', () => {
    component.form.patchValue({
      business_name: 'Example Business',
      legal_business_name: 'Example Business Ltd',
      business_type: 'CORPORATION',
    });

    component.currentStep = 2;
    component.submit();

    expect(component.currentStep).toBe(1);
    httpMock.expectNone(apiUrl);
  });

  it('should save a draft through the API', () => {
    fillValidForm();

    const emitSpy = vi.spyOn(component.draftSaved, 'emit');

    component.saveDraft();

    const request = httpMock.expectOne(apiUrl);

    expect(request.request.method).toBe('POST');
    expect(request.request.body.business_name).toBe('Example Business');

    request.flush({ id: 'app-1' });

    expect(emitSpy).toHaveBeenCalledOnce();
    expect(component.successMessage).toBe('Draft saved successfully.');
    expect(component.saving).toBe(false);
    expect(component.applicationId).toBe('app-1');
    expect(component.mode).toBe('edit');
  });

  it('should not save a draft while already saving', () => {
    component.saving = true;

    component.saveDraft();

    expect(component.saving).toBe(true);
    httpMock.expectNone(apiUrl);
  });

  it('should show an error when saving a draft fails', () => {
    fillValidForm();

    component.saveDraft();

    const request = httpMock.expectOne(apiUrl);

    request.flush(
      { message: 'Unable to save draft' },
      { status: 500, statusText: 'Server Error' },
    );

    expect(component.errorMessage).toBe('Unable to save draft');
    expect(component.saving).toBe(false);
  });

  it('should emit cancel and navigate when closed', () => {
    const cancelSpy = vi.spyOn(component.cancel, 'emit');

    component.close();

    expect(cancelSpy).toHaveBeenCalledOnce();
    expect(router.navigate).toHaveBeenCalledWith(['/applications']);
  });

  it('should not close while saving', () => {
    component.saving = true;

    component.close();

    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('should format business types', () => {
    expect(component.formatType('PRIVATE_LIMITED_COMPANY')).toBe(
      'Private Limited Company',
    );
  });

  it('should reset the form to default status values for a new application', () => {
    expect(component.form.controls.application_status.value).toBe('DRAFT');
    expect(component.form.controls.risk_status.value).toBe('PENDING');
    expect(component.form.controls.reviewer_id.value).toBe('');
  });
});
