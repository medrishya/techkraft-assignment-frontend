import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { Application } from '../../models/reviewer.model';

@Component({
  selector: 'app-review-header',
  standalone: true,
  imports: [RouterLink],
  template: `<header class="page-header">
    <div>
      <a routerLink="/dashboard" class="back-link">
        &larr; Back to dashboard
      </a>

      <h1>Application Review</h1>

      @if (application(); as app) {
        <p class="subtitle">
          {{ app.business_name }}
          <span class="application-id">{{ app.id }}</span>
        </p>
      }
    </div>

    @if (application(); as app) {
      <div class="status-group">
        <span
          class="status"
          [class.approved]="app.application_status === 'APPROVED'"
          [class.rejected]="app.application_status === 'REJECTED'"
        >
          {{ formatValue(app.application_status) }}
        </span>

        <span
          class="status"
          [class.approved]="app.risk_status === 'APPROVED'"
          [class.rejected]="app.risk_status === 'REJECTED'"
          [class.needs-info]="app.risk_status === 'NEEDS_INFO'"
        >
          Risk: {{ formatValue(app.risk_status) }}
        </span>
      </div>
    }
  </header> `,
})
export class ReviewHeaderComponent {
  application = input<Application | null>(null);
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
