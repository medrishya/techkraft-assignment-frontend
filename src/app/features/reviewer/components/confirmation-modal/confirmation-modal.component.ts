import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-confirmation-modal',
  standalone: true,
  template: `@if (visible()) {
    <div
      class="modal fade show d-block"
      tabindex="-1"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirmModalTitle"
      (click)="cancel.emit()"
    >
      <div
        class="modal-dialog modal-dialog-centered"
        role="document"
        (click)="$event.stopPropagation()"
      >
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="confirmModalTitle">
              {{ title() }}
            </h5>

            <button
              type="button"
              class="btn-close"
              aria-label="Close"
              [disabled]="busy()"
              (click)="cancel.emit()"
            ></button>
          </div>

          <div class="modal-body">
            {{ message() }}
          </div>

          <div class="modal-footer">
            <button
              type="button"
              class="btn btn-secondary"
              [disabled]="busy()"
              (click)="cancel.emit()"
            >
              Cancel
            </button>

            <button
              type="button"
              class="btn btn-primary"
              [disabled]="busy()"
              (click)="confirm.emit()"
            >
              Confirm
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="modal-backdrop fade show"></div>
  } `,
})
export class ConfirmationModalComponent {
  visible = input(false);
  title = input('');
  message = input('');
  busy = input(false);

  cancel = output<void>();
  confirm = output<void>();
}
