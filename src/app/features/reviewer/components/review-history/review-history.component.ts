import { Component, input, output } from '@angular/core';

import { Review } from '../../models/reviewer.model';

@Component({
  selector: 'app-review-history',
  standalone: true,
  template: `<section class="section-card">
    <div class="section-heading">
      <div>
        <h2>Review History</h2>
        <p>Previous decisions and review comments</p>
      </div>

      <button
        type="button"
        class="secondary-button"
        (click)="refresh.emit()"
        [disabled]="loadingReviews()"
      >
        {{ loadingReviews() ? 'Refreshing...' : 'Refresh' }}
      </button>
    </div>

    @if (loadingReviews()) {
      <p class="muted">Loading review history...</p>
    } @else if (reviews().length === 0) {
      <div class="empty-state">No review decisions have been recorded yet.</div>
    } @else {
      <div class="timeline">
        @for (review of reviews(); track review.id) {
          <article class="timeline-item">
            <div class="timeline-marker"></div>

            <div class="timeline-content">
              <div class="timeline-header">
                <strong>
                  {{ formatValue(review.decision || 'REVIEW') }}
                </strong>
                <time>{{ formatDate(review.created_at) }}</time>
              </div>

              <p class="review-actor">
                {{ review.actor_name || review.actor_id || 'Reviewer' }}
              </p>

              @if (review.comments) {
                <p class="review-comments">{{ review.comments }}</p>
              }

              <div class="review-status">
                <span
                  >Application:
                  {{ formatValue(review.application_status) || '—' }}</span
                >
                <span>Risk: {{ formatValue(review.risk_status) || '—' }}</span>
              </div>
            </div>
          </article>
        }
      </div>
    }
  </section> `,
})
export class ReviewHistoryComponent {
  reviews = input<Review[]>([]);
  loadingReviews = input(false);

  refresh = output<void>();

  formatDate(value: string | null | undefined): string {
    if (!value) return '—';

    const date = new Date(value);

    return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString();
  }

  formatValue(value: string | null | undefined): string {
    if (!value) return '—';

    return value
      .toLowerCase()
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
}
