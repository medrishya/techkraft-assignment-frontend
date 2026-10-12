import { Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';

export interface ApplicationFilterValues {
  search: string;
  applicationStatus: string;
  riskStatus: string;
}

@Component({
  selector: 'app-application-filters',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="card border-0 shadow-sm mb-4">
      <div class="card-body">
        <div class="row g-3 align-items-end">
          <div class="col-12 col-md-5">
            <label for="applicationSearch" class="form-label">
              Search applications
            </label>
            <input
              id="applicationSearch"
              class="form-control"
              type="search"
              placeholder="Business, owner, or email..."
              [ngModel]="search()"
              (ngModelChange)="searchChange.emit($event)"
              (keyup.enter)="submitFilters()"
            />
          </div>

          <div class="col-12 col-md-3">
            <label for="applicationStatus" class="form-label">
              Application status
            </label>
            <select
              id="applicationStatus"
              class="form-select"
              [ngModel]="applicationStatus()"
              (ngModelChange)="
                applicationStatusChange.emit($event); submitFilters()
              "
            >
              <option value="">All statuses</option>
              <option value="DRAFT">Draft</option>
              <option value="SUBMITTED">Submitted</option>
              <option value="UNDER_REVIEW">Under review</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>

          <div class="col-12 col-md-2">
            <label for="riskStatus" class="form-label">Risk status</label>
            <select
              id="riskStatus"
              class="form-select"
              [ngModel]="riskStatus()"
              (ngModelChange)="riskStatusChange.emit($event); submitFilters()"
            >
              <option value="">All risks</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="NEEDS_INFO">Needs Info</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>

          <div class="col-12 col-md-2 d-flex gap-2">
            <button
              type="button"
              class="btn btn-primary flex-grow-1"
              (click)="submitFilters()"
              [disabled]="disabled()"
            >
              Search
            </button>

            <button
              type="button"
              class="btn btn-outline-secondary"
              (click)="clearFilters()"
              [disabled]="disabled()"
              aria-label="Clear filters"
            >
              Clear
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class ApplicationFiltersComponent {
  readonly search = input('');
  readonly applicationStatus = input('');
  readonly riskStatus = input('');
  readonly disabled = input(false);

  readonly searchChange = output<string>();
  readonly applicationStatusChange = output<string>();
  readonly riskStatusChange = output<string>();
  readonly apply = output<void>();
  readonly clear = output<void>();

  submitFilters(): void {
    if (!this.disabled()) {
      this.apply.emit();
    }
  }

  clearFilters(): void {
    if (!this.disabled()) {
      this.clear.emit();
    }
  }
}
