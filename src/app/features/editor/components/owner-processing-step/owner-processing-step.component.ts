import { Component, input } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-owner-processing-step',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <div [formGroup]="form()">
      <h3>Owner &amp; Processing Information</h3>

      <div class="field">
        <label for="owner_name">Owner Name *</label>
        <input
          id="owner_name"
          formControlName="owner_name"
          placeholder="Enter owner name"
        />
        @if (hasError('owner_name')) {
          <small class="error">Owner name is required.</small>
        }
      </div>

      <div class="field">
        <label for="owner_email">Owner Email *</label>
        <input
          id="owner_email"
          type="email"
          formControlName="owner_email"
          placeholder="owner@example.com"
        />
        @if (hasError('owner_email')) {
          <small class="error">Enter a valid email address.</small>
        }
      </div>

      <div class="field">
        <label for="owner_phone">Owner Phone *</label>
        <input
          id="owner_phone"
          type="tel"
          formControlName="owner_phone"
          placeholder="Enter phone number"
        />
        @if (hasError('owner_phone')) {
          <small class="error">Owner phone is required.</small>
        }
      </div>

      <div class="field">
        <label for="processing_volume">Processing Volume *</label>
        <input
          id="processing_volume"
          type="number"
          min="0"
          formControlName="processing_volume"
          placeholder="Enter processing volume"
        />
        @if (hasError('processing_volume')) {
          <small class="error"> Enter a valid non-negative volume. </small>
        }
      </div>

      <div class="field">
        <label for="processing_currency">Processing Currency *</label>
        <select id="processing_currency" formControlName="processing_currency">
          <option value="">Select currency</option>
          @for (currency of currencies(); track currency) {
            <option [value]="currency">{{ currency }}</option>
          }
        </select>
        @if (hasError('processing_currency')) {
          <small class="error">Select a currency.</small>
        }
      </div>
    </div>
  `,
  styleUrl: `./owner-processing-step.component.css`,
})
export class OwnerProcessingStepComponent {
  readonly form = input.required<FormGroup>();
  readonly currencies = input.required<string[]>();

  hasError(name: string): boolean {
    const control = this.form().get(name);
    return !!control && control.invalid && (control.touched || control.dirty);
  }
}
