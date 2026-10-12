import { Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';

import { Application, Role } from '../../models/application.model';
import {
  formatDate,
  formatType,
  maskEmail,
  maskPhone,
  timeAgo,
} from '../../utils/application.utils';

@Component({
  selector: 'app-applications-table',
  standalone: true,
  imports: [RouterLink],
  styleUrl: './applications-table.component.css',
  template: `
    <div class="card border-0 shadow-sm">
      <div
        class="card-header bg-white py-3 d-flex flex-wrap justify-content-between align-items-center gap-2"
      >
        <h2 class="h5 mb-0">Applications</h2>
        <span class="text-secondary small"> {{ total() }} total records </span>
      </div>

      <div class="table-container">
        <table class="applications-table">
          <thead>
            <tr>
              <th scope="col">Business name</th>
              <th scope="col">Legal name</th>
              <th scope="col">Owner</th>
              <th scope="col" class="text-end">Volume</th>
              <th scope="col">Application</th>
              <th scope="col">Risk</th>

              @if (role() === 'ADMIN' || role() === 'REVIEWER') {
                <th scope="col">Created by</th>
              }

              @if (role() === 'ADMIN' || role() === 'SALES') {
                <th scope="col">Reviewer</th>
              }

              <th scope="col">Added</th>
              <th scope="col" class="text-end">Actions</th>
            </tr>
          </thead>

          <tbody>
            @if (loading()) {
              <tr>
                <td [attr.colspan]="columnCount()" class="empty-state">
                  <span class="spinner" role="status"></span>
                  <span>Loading applications...</span>
                </td>
              </tr>
            } @else if (applications().length === 0) {
              <tr>
                <td [attr.colspan]="columnCount()" class="empty-state muted">
                  No applications found.
                </td>
              </tr>
            } @else {
              @for (app of applications(); track app.id) {
                <tr>
                  <td>
                    <div class="primary-text">{{ app.business_name }}</div>
                    <div class="muted small-text">
                      {{ timeAgo(app.updated_at) }}
                    </div>
                  </td>

                  <td>
                    <div>{{ app.legal_business_name }}</div>
                    <div class="muted small-text">
                      {{ formatType(app.business_type) }}
                    </div>
                  </td>

                  <td>
                    <div class="primary-text">{{ app.owner_name }}</div>
                    <div class="contact-text">
                      {{
                        isContactRevealed(app.id)
                          ? app.owner_email
                          : maskEmail(app.owner_email)
                      }}
                    </div>
                    <div class="muted contact-text">
                      {{
                        isContactRevealed(app.id)
                          ? app.owner_phone
                          : maskPhone(app.owner_phone)
                      }}
                    </div>

                    @if (canRevealContact()) {
                      <button
                        type="button"
                        class="button secondary reveal-button"
                        (click)="toggleContact(app.id)"
                        [attr.aria-label]="
                          isContactRevealed(app.id)
                            ? 'Hide contact details'
                            : 'Reveal contact details'
                        "
                      >
                        {{ isContactRevealed(app.id) ? 'Hide' : 'Reveal' }}
                      </button>
                    }
                  </td>

                  <td class="text-end volume-cell">
                    {{ app.processing_currency }}
                    {{ app.processing_volume }}
                  </td>

                  <td>
                    <span class="status-badge application-badge">
                      {{ formatType(app.application_status) }}
                    </span>
                  </td>

                  <td>
                    <span
                      class="status-badge"
                      [class.status-approved]="app.risk_status === 'APPROVED'"
                      [class.status-warning]="
                        app.risk_status === 'NEEDS_INFO' ||
                        app.risk_status === 'PENDING'
                      "
                      [class.status-rejected]="app.risk_status === 'REJECTED'"
                      [class.status-neutral]="
                        ![
                          'PENDING',
                          'APPROVED',
                          'NEEDS_INFO',
                          'REJECTED',
                        ].includes(app.risk_status)
                      "
                    >
                      {{ formatType(app.risk_status) || 'N/A' }}
                    </span>
                  </td>

                  @if (role() === 'ADMIN' || role() === 'REVIEWER') {
                    <td>{{ app.created_by_name || 'Unassigned' }}</td>
                  }

                  @if (role() === 'ADMIN' || role() === 'SALES') {
                    <td>{{ app.assigned_reviewer_name || 'Unassigned' }}</td>
                  }

                  <td class="date-time">{{ formatDate(app.created_at) }}</td>

                  <td class="text-end">
                    <div class="table-actions">
                      @if (canReviewApplications()) {
                        <a
                          class="button primary action-button icon-action"
                          [routerLink]="['/reviewer', app.id]"
                          [attr.aria-label]="'Review ' + app.business_name"
                          [title]="'Review ' + app.business_name"
                        >
                          <i
                            class="bi bi-clipboard-check"
                            aria-hidden="true"
                          ></i>
                          <span class="action-label">Review</span>
                        </a>
                      }

                      @if (canEditApplications()) {
                        <a
                          class="button secondary action-button icon-action"
                          [routerLink]="['/editor', app.id]"
                          [class.disabled]="loading() || deletingId() !== null"
                          [attr.aria-disabled]="
                            loading() || deletingId() !== null
                          "
                          [attr.aria-label]="'Edit ' + app.business_name"
                          [title]="'Edit ' + app.business_name"
                        >
                          <i class="bi bi-pencil-square" aria-hidden="true"></i>
                          <span class="action-label">Edit</span>
                        </a>
                      }

                      @if (canDeleteApplications()) {
                        <button
                          type="button"
                          class="button danger action-button icon-action"
                          (click)="deleteRequested.emit(app)"
                          [disabled]="loading() || deletingId() !== null"
                          [attr.aria-label]="'Delete ' + app.business_name"
                          [title]="'Delete ' + app.business_name"
                        >
                          <i class="bi bi-trash3" aria-hidden="true"></i>
                          <span class="action-label">Delete</span>
                        </button>
                      }
                    </div>
                  </td>
                </tr>
              }
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
})
export class ApplicationsTableComponent {
  readonly applications = input<Application[]>([]);
  readonly role = input<Role | null>(null);
  readonly loading = input(false);
  readonly total = input(0);
  readonly deletingId = input<string | null>(null);
  readonly revealedContactIds = input<Set<string>>(new Set());

  readonly deleteRequested = output<Application>();
  readonly contactRevealToggled = output<string>();

  readonly formatDate = formatDate;
  readonly timeAgo = timeAgo;
  readonly formatType = formatType;
  readonly maskEmail = maskEmail;
  readonly maskPhone = maskPhone;

  readonly columnCount = () => {
    let count = 8;

    if (this.role() === 'ADMIN') {
      count += 2;
    } else if (this.role() === 'SALES' || this.role() === 'REVIEWER') {
      count += 1;
    }

    return count;
  };

  canReviewApplications(): boolean {
    return this.role() === 'ADMIN' || this.role() === 'REVIEWER';
  }

  canEditApplications(): boolean {
    return this.role() === 'ADMIN' || this.role() === 'SALES';
  }

  canDeleteApplications(): boolean {
    return this.role() === 'ADMIN' || this.role() === 'SALES';
  }

  canRevealContact(): boolean {
    return (
      this.role() === 'ADMIN' ||
      this.role() === 'SALES' ||
      this.role() === 'REVIEWER'
    );
  }

  isContactRevealed(id: string): boolean {
    return this.revealedContactIds().has(id);
  }

  toggleContact(id: string): void {
    if (this.canRevealContact()) {
      this.contactRevealToggled.emit(id);
    }
  }
}
