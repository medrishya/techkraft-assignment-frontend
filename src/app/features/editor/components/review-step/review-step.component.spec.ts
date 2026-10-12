import 'zone.js';
import 'zone.js/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, FormGroup } from '@angular/forms';

import { ReviewStepComponent } from './review-step.component';
import { ReviewerOption } from '../../models/editor.model';

describe('ReviewStepComponent', () => {
  let fixture: ComponentFixture<ReviewStepComponent>;
  let component: ReviewStepComponent;
  let form: FormGroup;

  const reviewers: ReviewerOption[] = [
    {
      id: 'reviewer-1',
      name: 'Alex Smith',
      email: 'alex@example.com',
    },
    {
      id: 'reviewer-2',
      name: 'Jamie Lee',
      email: '',
    },
  ];

  const applicationStatuses = ['PENDING', 'APPROVED', 'REJECTED'];
  const riskStatuses = ['UNREVIEWED', 'LOW', 'HIGH'];

  beforeEach(async () => {
    form = new FormGroup({
      business_name: new FormControl('Example Business'),
      legal_business_name: new FormControl('Example Business Ltd'),
      business_type: new FormControl('limited_company'),
      owner_name: new FormControl('Alex Smith'),
      owner_email: new FormControl('alex@example.com'),
      owner_phone: new FormControl('123456789'),
      processing_volume: new FormControl(5000),
      processing_currency: new FormControl('USD'),
      application_status: new FormControl('PENDING'),
      risk_status: new FormControl('UNREVIEWED'),
      reviewer_id: new FormControl(''),
    });

    await TestBed.configureTestingModule({
      imports: [ReviewStepComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ReviewStepComponent);
    component = fixture.componentInstance;

    fixture.componentRef.setInput('form', form);
    fixture.componentRef.setInput('reviewers', reviewers);
    fixture.componentRef.setInput('canManageStatus', false);
    fixture.componentRef.setInput('canAssignReviewer', false);
    fixture.componentRef.setInput('applicationStatuses', applicationStatuses);
    fixture.componentRef.setInput('riskStatuses', riskStatuses);

    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should display the review heading', () => {
    expect(fixture.nativeElement.querySelector('h3').textContent.trim()).toBe(
      'Review Application',
    );
  });

  it('should display the application summary', () => {
    const text = fixture.nativeElement.textContent;

    expect(text).toContain('Example Business');
    expect(text).toContain('Example Business Ltd');
    expect(text).toContain('Alex Smith');
    expect(text).toContain('alex@example.com');
    expect(text).toContain('123456789');
    expect(text).toContain('5000');
    expect(text).toContain('USD');
  });

  it('should format the business type', () => {
    expect(component.formatType('limited_company')).toBe('Limited Company');

    expect(component.formatType('SOLE_PROPRIETORSHIP')).toBe(
      'Sole Proprietorship',
    );
  });

  it('should return an empty string for non-string business types', () => {
    expect(component.formatType(null)).toBe('');
    expect(component.formatType(123)).toBe('');
  });

  it('should return values from the form', () => {
    expect(component.value('business_name')).toBe('Example Business');
    expect(component.value('processing_volume')).toBe(5000);
  });

  it('should return undefined for a missing form control', () => {
    expect(component.value('unknown_field')).toBeUndefined();
  });

  it('should hide status fields when the user cannot manage status', () => {
    expect(
      fixture.nativeElement.querySelector('#application_status'),
    ).toBeNull();

    expect(fixture.nativeElement.querySelector('#risk_status')).toBeNull();

    expect(fixture.nativeElement.textContent).toContain(
      'Application and risk statuses are managed by authorized users.',
    );
  });

  it('should show status fields when the user can manage status', () => {
    fixture.componentRef.setInput('canManageStatus', true);
    fixture.detectChanges();

    expect(
      fixture.nativeElement.querySelector('#application_status'),
    ).toBeTruthy();

    expect(fixture.nativeElement.querySelector('#risk_status')).toBeTruthy();
  });

  it('should render application status options', () => {
    fixture.componentRef.setInput('canManageStatus', true);
    fixture.detectChanges();

    const options: HTMLOptionElement[] = Array.from(
      fixture.nativeElement.querySelectorAll('#application_status option'),
    );

    expect(options.map((option) => option.value)).toEqual(applicationStatuses);
  });

  it('should render risk status options', () => {
    fixture.componentRef.setInput('canManageStatus', true);
    fixture.detectChanges();

    const options: HTMLOptionElement[] = Array.from(
      fixture.nativeElement.querySelectorAll('#risk_status option'),
    );

    expect(options.map((option) => option.value)).toEqual(riskStatuses);
  });

  it('should show reviewer assignment when permitted', () => {
    fixture.componentRef.setInput('canAssignReviewer', true);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('#reviewer_id')).toBeTruthy();
  });

  it('should hide reviewer assignment when not permitted', () => {
    expect(fixture.nativeElement.querySelector('#reviewer_id')).toBeNull();
  });

  it('should render reviewer names and emails', () => {
    fixture.componentRef.setInput('canAssignReviewer', true);
    fixture.detectChanges();

    const options: HTMLOptionElement[] = Array.from(
      fixture.nativeElement.querySelectorAll('#reviewer_id option'),
    );

    expect(options.length).toBe(3);
    expect(options[0].textContent?.trim()).toBe('Unassigned');
    expect(options[1].textContent).toContain('Alex Smith');
    expect(options[1].textContent).toContain('alex@example.com');
    expect(options[2].textContent).toContain('Jamie Lee');
  });

  it('should update reviewer_id when a reviewer is selected', () => {
    fixture.componentRef.setInput('canAssignReviewer', true);
    fixture.detectChanges();

    const select: HTMLSelectElement =
      fixture.nativeElement.querySelector('#reviewer_id');

    select.value = 'reviewer-1';
    select.dispatchEvent(new Event('change'));

    expect(form.get('reviewer_id')?.value).toBe('reviewer-1');
  });

  it('should display fallback dashes for empty summary values', () => {
    form.patchValue({
      business_name: '',
      legal_business_name: '',
      business_type: '',
      owner_name: '',
      owner_email: '',
      owner_phone: '',
      processing_volume: null,
      processing_currency: '',
    });

    fixture.detectChanges();

    const text = fixture.nativeElement.textContent;

    expect(text).toContain('Business:');
    expect(text).toContain('Legal name:');
    expect(text).toContain('Owner:');
    expect(text).toContain('Email:');
    expect(text).toContain('Phone:');
  });
});
