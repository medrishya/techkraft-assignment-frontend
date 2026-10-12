import { Component, input } from '@angular/core';

@Component({
  selector: 'app-editor-progress',
  standalone: true,
  template: `
    <div class="progress">
      @for (step of steps(); track step; let i = $index) {
        <div
          class="progress-item"
          [class.active]="currentStep() === i"
          [class.completed]="currentStep() > i"
          [attr.aria-current]="currentStep() === i ? 'step' : null"
        >
          <span>{{ i + 1 }}</span>
          <small>{{ step }}</small>
        </div>
      }
    </div>
  `,
  styles: [
    `
      .progress {
        display: flex;
        gap: 0.75rem;
        margin: 1.5rem 0;
        height: 48px;
      }

      .progress-item {
        display: flex;
        flex: 1;
        align-items: center;
        gap: 0.5rem;
        min-width: 0;
        color: #64748b;
      }

      .progress-item > span {
        display: grid;
        place-items: center;
        flex-shrink: 0;
        width: 2rem;
        height: 2rem;
        border: 1px solid #cbd5e1;
        border-radius: 50%;
        font-size: 0.8125rem;
      }

      .progress-item small {
        font-size: 0.8125rem;
      }

      .progress-item.active {
        color: #1d4ed8;
        font-weight: 600;
      }

      .progress-item.active > span {
        border-color: #2563eb;
        background: #2563eb;
        color: white;
      }

      .progress-item.completed > span {
        border-color: #16a34a;
        background: #dcfce7;
        color: #166534;
      }

      @media (max-width: 600px) {
        .progress {
          gap: 0.35rem;
        }

        .progress-item {
          flex-direction: column;
          align-items: flex-start;
        }

        .progress-item small {
          font-size: 0.7rem;
        }
      }
    `,
  ],
})
export class EditorProgressComponent {
  readonly steps = input.required<string[]>();
  readonly currentStep = input.required<number>();
}
