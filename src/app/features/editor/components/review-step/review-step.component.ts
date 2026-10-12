import { Component, input } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { EditorRole, ReviewerOption } from '../../models/editor.model';

@Component({
  selector: 'app-review-step',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <div [formGroup]="form()">
      <h3>Review Application</h3>

      @if (canManageStatus()) {
        <div class="field">
          <label for="application_status">Application Status</label>
          <select id="application_status" formControlName="application_status">
            @for (status of applicationStatuses(); track status) {
              <option [value]="status">{{ status }}</option>
            }
          </select>
        </div>

        <div class="field">
          <label for="risk_status">Risk Status</label>
          <select id="risk_status" formControlName="risk_status">
            @for (status of riskStatuses(); track status) {
              <option [value]="status">{{ status }}</option>
            }
          </select>
        </div>
      } @else {
        <p class="muted">
          Application and risk statuses are managed by authorized users.
        </p>
      }

      @if (canAssignReviewer()) {
        <div class="field">
          <label for="reviewer_id">Assign Reviewer</label>
          <select id="reviewer_id" formControlName="reviewer_id">
            <option value="">Unassigned</option>
            @for (reviewer of reviewers(); track reviewer.id) {
              <option [value]="reviewer.id">
                {{ reviewer.name }}
                @if (reviewer.email) {
                  ({{ reviewer.email }})
                }
              </option>
            }
          </select>
        </div>
      }

      <div class="review">
        <h4>Application Summary</h4>

        <p>
          <strong>Business:</strong>
          {{ value('business_name') || '—' }}
        </p>
        <p>
          <strong>Legal name:</strong>
          {{ value('legal_business_name') || '—' }}
        </p>
        <p>
          <strong>Business type:</strong>
          {{ formatType(value('business_type') || '—') }}
        </p>
        <p>
          <strong>Owner:</strong>
          {{ value('owner_name') || '—' }}
        </p>
        <p>
          <strong>Email:</strong>
          {{ value('owner_email') || '—' }}
        </p>
        <p>
          <strong>Phone:</strong>
          {{ value('owner_phone') || '—' }}
        </p>
        <p>
          <strong>Processing volume:</strong>
          {{ value('processing_volume') ?? '—' }}
          {{ value('processing_currency') }}
        </p>
      </div>
    </div>
  `,
  styles: [
    `
      .field {
        display: flex;
        flex-direction: column;
        gap: 0.4rem;
        margin-bottom: 1rem;
      }

      .review {
        margin-top: 1.5rem;
        padding: 1rem;
        border: 1px solid #e2e8f0;
        border-radius: 0.5rem;
        background: #f8fafc;
      }

      .review h4 {
        margin-top: 0;
      }

      .review p {
        margin-bottom: 0.6rem;
        overflow-wrap: anywhere;
      }

      .muted {
        color: #64748b;
      }
    `,
  ],
})
export class ReviewStepComponent {
  readonly form = input.required<FormGroup>();
  readonly reviewers = input<ReviewerOption[]>([]);
  readonly canManageStatus = input(false);
  readonly canAssignReviewer = input(false);
  readonly applicationStatuses = input.required<string[]>();
  readonly riskStatuses = input.required<string[]>();

  value(name: string): unknown {
    return this.form().get(name)?.value;
  }

  formatType(value: unknown): string {
    if (typeof value !== 'string') {
      return '';
    }

    return value
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(/\b\w/g, (char) => char.toUpperCase());
  }
}
