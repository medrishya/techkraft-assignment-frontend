import 'zone.js';
import 'zone.js/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

import { OwnerProcessingStepComponent } from './owner-processing-step.component';

describe('OwnerProcessingStepComponent', () => {
  let fixture: ComponentFixture<OwnerProcessingStepComponent>;
  let component: OwnerProcessingStepComponent;
  let form: FormGroup;

  const currencies = ['USD', 'EUR', 'NPR'];

  beforeEach(async () => {
    form = new FormGroup({
      owner_name: new FormControl('', Validators.required),
      owner_email: new FormControl('', [Validators.required, Validators.email]),
      owner_phone: new FormControl('', Validators.required),
      processing_volume: new FormControl(null, [
        Validators.required,
        Validators.min(0),
      ]),
      processing_currency: new FormControl('', Validators.required),
    });

    await TestBed.configureTestingModule({
      imports: [OwnerProcessingStepComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(OwnerProcessingStepComponent);
    component = fixture.componentInstance;

    fixture.componentRef.setInput('form', form);
    fixture.componentRef.setInput('currencies', currencies);

    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should display the heading', () => {
    expect(fixture.nativeElement.querySelector('h3').textContent.trim()).toBe(
      'Owner & Processing Information',
    );
  });

  it('should render all five form fields', () => {
    expect(fixture.nativeElement.querySelectorAll('input').length).toBe(4);

    expect(fixture.nativeElement.querySelectorAll('select').length).toBe(1);
  });

  it('should render the available currencies', () => {
    const options: HTMLOptionElement[] = Array.from(
      fixture.nativeElement.querySelectorAll('#processing_currency option'),
    );

    expect(options.length).toBe(4);
    expect(options[1].value).toBe('USD');
    expect(options[2].value).toBe('EUR');
    expect(options[3].value).toBe('NPR');
  });

  it('should not show errors for untouched controls', () => {
    expect(component.hasError('owner_name')).toBe(false);
    expect(component.hasError('owner_email')).toBe(false);
    expect(component.hasError('owner_phone')).toBe(false);
    expect(component.hasError('processing_volume')).toBe(false);
    expect(component.hasError('processing_currency')).toBe(false);
  });

  it('should show the owner name error when touched and empty', () => {
    form.get('owner_name')?.markAsTouched();
    fixture.detectChanges();

    expect(component.hasError('owner_name')).toBe(true);
    expect(fixture.nativeElement.textContent).toContain(
      'Owner name is required.',
    );
  });

  it('should show the email error for an invalid email', () => {
    const control = form.get('owner_email');
    control?.setValue('invalid-email');
    control?.markAsTouched();
    fixture.detectChanges();

    expect(component.hasError('owner_email')).toBe(true);
    expect(fixture.nativeElement.textContent).toContain(
      'Enter a valid email address.',
    );
  });

  it('should not show the email error for a valid email', () => {
    const control = form.get('owner_email');
    control?.setValue('owner@example.com');
    control?.markAsTouched();
    fixture.detectChanges();

    expect(component.hasError('owner_email')).toBe(false);
  });

  it('should show the phone error when touched and empty', () => {
    form.get('owner_phone')?.markAsTouched();
    fixture.detectChanges();

    expect(component.hasError('owner_phone')).toBe(true);
    expect(fixture.nativeElement.textContent).toContain(
      'Owner phone is required.',
    );
  });

  it('should show the processing volume error for a negative value', () => {
    const control = form.get('processing_volume');
    control?.setValue(-10);
    control?.markAsTouched();
    fixture.detectChanges();

    expect(component.hasError('processing_volume')).toBe(true);
    expect(fixture.nativeElement.textContent).toContain(
      'Enter a valid non-negative volume.',
    );
  });

  it('should accept a non-negative processing volume', () => {
    const control = form.get('processing_volume');
    control?.setValue(1000);
    control?.markAsTouched();
    fixture.detectChanges();

    expect(component.hasError('processing_volume')).toBe(false);
  });

  it('should show the currency error when no currency is selected', () => {
    form.get('processing_currency')?.markAsTouched();
    fixture.detectChanges();

    expect(component.hasError('processing_currency')).toBe(true);
    expect(fixture.nativeElement.textContent).toContain('Select a currency.');
  });

  it('should update the owner name form control when typing', () => {
    const input: HTMLInputElement =
      fixture.nativeElement.querySelector('#owner_name');

    input.value = 'Alex Smith';
    input.dispatchEvent(new Event('input'));

    expect(form.get('owner_name')?.value).toBe('Alex Smith');
  });

  it('should update the currency form control when selecting a currency', () => {
    const select: HTMLSelectElement = fixture.nativeElement.querySelector(
      '#processing_currency',
    );

    select.value = 'NPR';
    select.dispatchEvent(new Event('change'));

    expect(form.get('processing_currency')?.value).toBe('NPR');
  });

  it('should return false for a control that does not exist', () => {
    expect(component.hasError('unknown_control')).toBe(false);
  });
});
