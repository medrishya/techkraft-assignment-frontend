import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-editor-actions',
  standalone: true,
  template: `
    <footer class="actions">
      <button
        type="button"
        class="button secondary"
        (click)="previous.emit()"
        [disabled]="currentStep() === 0 || saving()"
      >
        Back
      </button>

      <div class="right-actions">
        @if (currentStep() < totalSteps() - 1) {
          <button
            type="button"
            class="button primary"
            (click)="next.emit()"
            [disabled]="saving()"
          >
            Next
          </button>
        } @else {
          <button type="submit" class="button primary" [disabled]="saving()">
            {{
              saving()
                ? 'Saving...'
                : mode() === 'add'
                  ? 'Create Application'
                  : 'Update Application'
            }}
          </button>
        }
      </div>
    </footer>
  `,
  styleUrl: `./editor-actions.component.css`,
})
export class EditorActionsComponent {
  readonly currentStep = input.required<number>();
  readonly totalSteps = input.required<number>();
  readonly saving = input(false);
  readonly mode = input.required<'add' | 'edit'>();

  readonly previous = output<void>();
  readonly next = output<void>();
}
