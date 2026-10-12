import { Component, input, output } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-review-decision',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `<section class="section-card review-card">
    <h2>Review Decision</h2>
    <p class="muted">Record your decision for this application.</p>

    @if (canReview()) {
      <form [formGroup]="reviewForm()" (ngSubmit)="submitDecision.emit()">
        <div class="form-field">
          <label for="decision">Decision</label>

          <select id="decision" formControlName="decision">
            <option value="APPROVE">Approve</option>
            <option value="REJECT">Reject</option>
            <option value="REQUEST_INFO">Request Information</option>
          </select>
        </div>

        <div class="form-field">
          <label for="comments">Review Comments</label>

          <textarea
            id="comments"
            rows="5"
            maxlength="2000"
            formControlName="comments"
            placeholder="Enter your findings or explain what information is needed..."
          ></textarea>

          <div class="character-count">{{ commentLength }}/2000</div>
        </div>

        <div class="decision-help">
          @switch (reviewForm().get('decision')?.value) {
            @case ('APPROVE') {
              <p>The application and risk statuses will become approved.</p>
            }
            @case ('REJECT') {
              <p>The application and risk statuses will become rejected.</p>
            }
            @case ('REQUEST_INFO') {
              <p>
                The application status will become under review and the risk
                status will become need info.
              </p>
            }
          }
        </div>

        <button
          type="submit"
          class="primary-button"
          [disabled]="submitting() || loading()"
        >
          {{ submitting() ? 'Submitting...' : 'Submit Review Decision' }}
        </button>
      </form>
    } @else {
      <div class="restricted">
        Review actions are unavailable for your role.
      </div>
    }
  </section> `,
})
export class ReviewDecisionComponent {
  reviewForm = input.required<FormGroup>();
  canReview = input(false);
  submitting = input(false);
  loading = input(false);

  submitDecision = output<void>();

  get commentLength(): number {
    return String(this.reviewForm().get('comments')?.value ?? '').length;
  }
}
