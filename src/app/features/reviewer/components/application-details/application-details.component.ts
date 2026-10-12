import { Component, input } from '@angular/core';

import { Application } from '../../models/reviewer.model';

@Component({
  selector: 'app-application-details',
  standalone: true,
  template: `<section class="section-card">
      <div class="section-heading">
        <div>
          <h2>Business Information</h2>
          <p>Business registration and classification</p>
        </div>
      </div>

      <div class="details-grid">
        <div class="detail">
          <label>Business Name</label>
          <p>{{ application().business_name || '—' }}</p>
        </div>

        <div class="detail">
          <label>Legal Business Name</label>
          <p>{{ application().legal_business_name || '—' }}</p>
        </div>

        <div class="detail">
          <label>Business Type</label>
          <p>{{ formatValue(application().business_type) }}</p>
        </div>

        <div class="detail">
          <label>Application ID</label>
          <p>{{ application().id }}</p>
        </div>
      </div>
    </section>

    <section class="section-card">
      <div class="section-heading">
        <div>
          <h2>Owner Information</h2>
          <p>Applicant contact details</p>
        </div>
      </div>

      <div class="details-grid">
        <div class="detail">
          <label>Owner Name</label>
          <p>{{ application().owner_name || '—' }}</p>
        </div>

        <div class="detail">
          <label>Email Address</label>
          <p>{{ application().owner_email || '—' }}</p>
        </div>

        <div class="detail">
          <label>Phone Number</label>
          <p>{{ application().owner_phone || '—' }}</p>
        </div>
      </div>
    </section>

    <section class="section-card">
      <div class="section-heading">
        <div>
          <h2>Processing Information</h2>
          <p>Expected payment processing activity</p>
        </div>
      </div>

      <div class="details-grid">
        <div class="detail">
          <label>Processing Volume</label>
          <p>
            {{
              formatVolume(
                application().processing_volume,
                application().processing_currency
              )
            }}
          </p>
        </div>

        <div class="detail">
          <label>Currency</label>
          <p>{{ application().processing_currency || '—' }}</p>
        </div>
      </div>
    </section>

    <section class="section-card">
      <div class="section-heading">
        <div>
          <h2>Application Metadata</h2>
          <p>Ownership and timestamps</p>
        </div>
      </div>

      <div class="details-grid">
        <div class="detail">
          <label>Created By</label>
          <p>
            {{
              application().created_by_name ||
                application().created_by_id ||
                '—'
            }}
          </p>
        </div>

        <div class="detail">
          <label>Assigned Reviewer</label>
          <p>
            {{
              application().assigned_reviewer_name ||
                application().assigned_reviewer_id ||
                application().reviewer_id ||
                '—'
            }}
          </p>
        </div>

        <div class="detail">
          <label>Created At</label>
          <p>{{ formatDate(application().created_at) }}</p>
        </div>

        <div class="detail">
          <label>Last Updated</label>
          <p>{{ formatDate(application().updated_at) }}</p>
        </div>
      </div>
    </section> `,
})
export class ApplicationDetailsComponent {
  application = input.required<Application>();

  formatDate(value: string | null | undefined): string {
    if (!value) return '—';

    const date = new Date(value);

    return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString();
  }

  formatVolume(
    value: number | null | undefined,
    currency: string | null | undefined,
  ): string {
    if (value === null || value === undefined) return '—';

    return `${new Intl.NumberFormat().format(value)} ${currency || ''}`.trim();
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
