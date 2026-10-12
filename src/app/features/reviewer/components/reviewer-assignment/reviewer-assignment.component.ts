import { Component, effect, input, output } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';

import { Application, ReviewerOption } from '../../models/reviewer.model';

@Component({
  selector: 'app-reviewer-assignment',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `<section class="section-card assignment-card">
    <div class="card-icon" aria-hidden="true">
      <i class="bi bi-person-gear"></i>
    </div>

    <h2>Reassign Reviewer</h2>
    <p class="muted">Change the reviewer responsible for this application.</p>

    <div class="current-assignment">
      <span class="current-assignment-label">Currently assigned</span>
      <strong>{{
        application().assigned_reviewer_name || 'Unassigned'
      }}</strong>
    </div>

    <form [formGroup]="assignmentForm()" (ngSubmit)="submitAssignment.emit()">
      <div class="form-field">
        <label for="assigned_reviewer_id">Select Reviewer</label>

        <select
          id="assigned_reviewer_id"
          formControlName="reviewerId"
          [disabled]="loadingReviewers() || savingAssignment()"
        >
          <option value="">Unassigned</option>

          @for (reviewer of reviewers(); track reviewer.id) {
            <option [value]="reviewer.id">
              {{ reviewerDisplayName(reviewer) }}
              @if (reviewer.email) {
                ({{ reviewer.email }})
              }
            </option>
          }
        </select>
      </div>

      @if (loadingReviewers()) {
        <p class="muted">Loading available reviewers...</p>
      } @else if (reviewers().length === 0) {
        <p class="inline-warning">No reviewers were returned by the API.</p>
      }

      <button
        type="submit"
        class="primary-button"
        [disabled]="savingAssignment() || loadingReviewers() || unchanged()"
      >
        {{ savingAssignment() ? 'Saving assignment...' : 'Save Assignment' }}
      </button>
    </form>
  </section> `,
})
export class ReviewerAssignmentComponent {
  application = input.required<Application>();
  reviewers = input<ReviewerOption[]>([]);
  assignmentForm = input.required<FormGroup>();

  loadingReviewers = input(false);
  savingAssignment = input(false);
  unchanged = input(false);

  submitAssignment = output<void>();

  constructor() {
    effect(() => {
      const reviewerControl = this.assignmentForm().get('reviewerId');

      if (!reviewerControl) {
        return;
      }

      const shouldDisable = this.loadingReviewers() || this.savingAssignment();

      if (shouldDisable && reviewerControl.enabled) {
        reviewerControl.disable({ emitEvent: false });
      } else if (!shouldDisable && reviewerControl.disabled) {
        reviewerControl.enable({ emitEvent: false });
      }
    });
  }

  reviewerDisplayName(reviewer: ReviewerOption): string {
    const suppliedName = reviewer.name?.trim();

    if (suppliedName) return suppliedName;

    const fullName = [reviewer.first_name, reviewer.last_name]
      .filter(Boolean)
      .join(' ')
      .trim();

    return fullName || reviewer.email || reviewer.id;
  }
}
