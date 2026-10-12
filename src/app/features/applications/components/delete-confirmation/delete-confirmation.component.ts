import { Component, input, output } from '@angular/core';

import { Application } from '../../models/application.model';

@Component({
  selector: 'app-delete-confirmation',
  standalone: true,
  template: `
    @if (open()) {
      <div
        class="modal-backdrop show"
        style="z-index: 1050"
        (click)="cancel.emit()"
        aria-hidden="true"
      ></div>

      <div
        class="modal fade show d-block"
        tabindex="-1"
        role="dialog"
        aria-modal="true"
        aria-labelledby="deleteModalTitle"
        aria-describedby="deleteModalDescription"
        style="z-index: 1055"
        (click)="cancel.emit()"
        (keydown.escape)="cancel.emit()"
      >
        <div
          class="modal-dialog modal-dialog-centered"
          role="document"
          (click)="$event.stopPropagation()"
        >
          <div class="modal-content border-0 shadow">
            <div class="modal-header">
              <h2 class="modal-title fs-5" id="deleteModalTitle">
                Confirm deletion
              </h2>

              <button
                type="button"
                class="btn-close"
                aria-label="Close"
                [disabled]="deleting()"
                (click)="cancel.emit()"
              ></button>
            </div>

            <div class="modal-body">
              <p id="deleteModalDescription" class="mb-2">
                Are you sure you want to delete this application?
              </p>

              @if (application(); as selected) {
                <div class="rounded border bg-light p-3">
                  <div class="fw-semibold">
                    {{ selected.business_name }}
                  </div>

                  <div class="text-secondary small">
                    {{ selected.legal_business_name }}
                  </div>

                  <div class="text-secondary small mt-1">
                    Owner: {{ selected.owner_name }}
                  </div>
                </div>
              }

              <p class="text-danger small mt-3 mb-0">
                This action cannot be undone.
              </p>
            </div>

            <div class="modal-footer">
              <button
                type="button"
                class="btn btn-outline-secondary"
                (click)="cancel.emit()"
                [disabled]="deleting()"
              >
                Cancel
              </button>

              <button
                type="button"
                class="btn btn-danger"
                (click)="confirm.emit()"
                [disabled]="deleting() || !application()"
              >
                @if (deleting()) {
                  <span
                    class="spinner-border spinner-border-sm me-2"
                    aria-hidden="true"
                  ></span>
                  Deleting...
                } @else {
                  <i class="bi bi-trash3 me-1" aria-hidden="true"></i>
                  Delete application
                }
              </button>
            </div>
          </div>
        </div>
      </div>
    }
  `,
})
export class DeleteConfirmationComponent {
  readonly open = input(false);
  readonly application = input<Application | null>(null);
  readonly deleting = input(false);

  readonly cancel = output<void>();
  readonly confirm = output<void>();
}
