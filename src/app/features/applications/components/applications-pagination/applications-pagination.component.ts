import { Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-applications-pagination',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="pagination-bar">
      <div class="pagination-info">
        <label for="pageSize" class="page-size-label"> Rows per page </label>

        <select
          id="pageSize"
          class="page-size-select"
          [ngModel]="limit()"
          (ngModelChange)="pageSizeChange.emit(+$event)"
          [disabled]="disabled()"
        >
          <option [ngValue]="10">10</option>
          <option [ngValue]="25">25</option>
          <option [ngValue]="50">50</option>
          <option [ngValue]="100">100</option>
        </select>

        <span class="record-count">
          {{ recordStart() }}–{{ recordEnd() }} of {{ total() }}
        </span>
      </div>

      <nav class="pagination-controls" aria-label="Application pagination">
        <span class="page-indicator">
          Page <strong>{{ page() }}</strong> of {{ totalPages() }}
        </span>

        <div class="page-buttons">
          <button
            type="button"
            class="page-button"
            (click)="pageChange.emit(page() - 1)"
            [disabled]="disabled() || page() <= 1"
            aria-label="Go to previous page"
          >
            <span aria-hidden="true">&larr;</span>
            <span class="button-label">Previous</span>
          </button>

          <button
            type="button"
            class="page-button"
            (click)="pageChange.emit(page() + 1)"
            [disabled]="disabled() || page() >= totalPages()"
            aria-label="Go to next page"
          >
            <span class="button-label">Next</span>
            <span aria-hidden="true">&rarr;</span>
          </button>
        </div>
      </nav>
    </div>
  `,
  styleUrl: `./applications-pagination.component.css`,
})
export class ApplicationsPaginationComponent {
  readonly page = input(1);
  readonly limit = input(10);
  readonly totalPages = input(1);
  readonly total = input(0);
  readonly disabled = input(false);

  readonly pageChange = output<number>();
  readonly pageSizeChange = output<number>();

  readonly recordStart = () =>
    this.total() === 0 ? 0 : (this.page() - 1) * this.limit() + 1;

  readonly recordEnd = () => Math.min(this.page() * this.limit(), this.total());
}
