import 'zone.js';
import 'zone.js/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, FormGroup, Validators } from '@angular/forms';

import { BusinessStepComponent } from './business-step.component';

describe('BusinessStepComponent', () => {
  let fixture: ComponentFixture<BusinessStepComponent>;
  let component: BusinessStepComponent;

  let form: FormGroup;

  const businessTypes = [
    'sole_proprietorship',
    'limited_company',
    'partnership',
  ];

  beforeEach(async () => {
    form = new FormGroup({
      business_name: new FormControl('', Validators.required),
      legal_business_name: new FormControl('', Validators.required),
      business_type: new FormControl('', Validators.required),
    });

    await TestBed.configureTestingModule({
      imports: [BusinessStepComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(BusinessStepComponent);
    component = fixture.componentInstance;

    fixture.componentRef.setInput('form', form);
    fixture.componentRef.setInput('businessTypes', businessTypes);

    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should display the business information heading', () => {
    expect(fixture.nativeElement.querySelector('h3').textContent.trim()).toBe(
      'Business Information',
    );
  });

  it('should render the business type options', () => {
    const options: HTMLOptionElement[] = Array.from(
      fixture.nativeElement.querySelectorAll('#business_type option'),
    );

    expect(options.length).toBe(4);
    expect(options[1].value).toBe('sole_proprietorship');
    expect(options[2].value).toBe('limited_company');
    expect(options[3].value).toBe('partnership');
  });

  it('should format business type labels', () => {
    expect(component.formatType('sole_proprietorship')).toBe(
      'Sole Proprietorship',
    );

    expect(component.formatType('LIMITED_COMPANY')).toBe('Limited Company');
  });

  it('should not show errors for untouched controls', () => {
    expect(component.hasError('business_name')).toBe(false);
    expect(component.hasError('legal_business_name')).toBe(false);
    expect(component.hasError('business_type')).toBe(false);
  });

  it('should show the business name error when the empty control is touched', () => {
    form.get('business_name')?.markAsTouched();
    fixture.detectChanges();

    expect(component.hasError('business_name')).toBe(true);

    expect(
      fixture.nativeElement.querySelector('.error')?.textContent.trim(),
    ).toBe('Business name is required.');
  });

  it('should show the legal business name error when touched and invalid', () => {
    form.get('legal_business_name')?.markAsTouched();
    fixture.detectChanges();

    expect(component.hasError('legal_business_name')).toBe(true);

    expect(fixture.nativeElement.textContent).toContain(
      'Legal business name is required.',
    );
  });

  it('should show the business type error when touched and invalid', () => {
    form.get('business_type')?.markAsTouched();
    fixture.detectChanges();

    expect(component.hasError('business_type')).toBe(true);

    expect(fixture.nativeElement.textContent).toContain(
      'Select a business type.',
    );
  });

  it('should hide the business name error when a valid value is entered', () => {
    const control = form.get('business_name');

    control?.markAsTouched();
    control?.setValue('Example Business');
    fixture.detectChanges();

    expect(component.hasError('business_name')).toBe(false);

    expect(fixture.nativeElement.textContent).not.toContain(
      'Business name is required.',
    );
  });

  it('should return false for a control that does not exist', () => {
    expect(component.hasError('unknown_control')).toBe(false);
  });

  it('should update the form when the business name input changes', () => {
    const input: HTMLInputElement =
      fixture.nativeElement.querySelector('#business_name');

    input.value = 'Example Business';
    input.dispatchEvent(new Event('input'));

    expect(form.get('business_name')?.value).toBe('Example Business');
  });

  it('should update the form when a business type is selected', () => {
    const select: HTMLSelectElement =
      fixture.nativeElement.querySelector('#business_type');

    select.value = 'limited_company';
    select.dispatchEvent(new Event('change'));

    expect(form.get('business_type')?.value).toBe('limited_company');
  });
});
