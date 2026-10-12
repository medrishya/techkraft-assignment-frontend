import { Component, input } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-business-step',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <div [formGroup]="form()">
      <h3>Business Information</h3>

      <div class="field">
        <label for="business_name">Business Name *</label>
        <input
          id="business_name"
          formControlName="business_name"
          placeholder="Enter business name"
        />
        @if (hasError('business_name')) {
          <small class="error">Business name is required.</small>
        }
      </div>

      <div class="field">
        <label for="legal_business_name">Legal Business Name *</label>
        <input
          id="legal_business_name"
          formControlName="legal_business_name"
          placeholder="Enter legal business name"
        />
        @if (hasError('legal_business_name')) {
          <small class="error">Legal business name is required.</small>
        }
      </div>

      <div class="field">
        <label for="business_type">Business Type *</label>
        <select id="business_type" formControlName="business_type">
          <option value="">Select business type</option>
          @for (type of businessTypes(); track type) {
            <option [value]="type">{{ formatType(type) }}</option>
          }
        </select>
        @if (hasError('business_type')) {
          <small class="error">Select a business type.</small>
        }
      </div>
    </div>
  `,
  styleUrl: `business-step.component.css`,
})
export class BusinessStepComponent {
  readonly form = input.required<FormGroup>();
  readonly businessTypes = input.required<string[]>();

  hasError(name: string): boolean {
    const control = this.form().get(name);
    return !!control && control.invalid && (control.touched || control.dirty);
  }

  formatType(value: string): string {
    return value
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(/\b\w/g, (char) => char.toUpperCase());
  }
}
