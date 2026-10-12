import 'zone.js';
import 'zone.js/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EditorProgressComponent } from './editor-progress.component';

describe('EditorProgressComponent', () => {
  let fixture: ComponentFixture<EditorProgressComponent>;
  let component: EditorProgressComponent;

  const steps = ['Business Information', 'Owner Information', 'Review'];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditorProgressComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(EditorProgressComponent);
    component = fixture.componentInstance;

    fixture.componentRef.setInput('steps', steps);
    fixture.componentRef.setInput('currentStep', 0);

    fixture.detectChanges();
  });

  function progressItems(): HTMLElement[] {
    return Array.from(fixture.nativeElement.querySelectorAll('.progress-item'));
  }

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should render all steps', () => {
    expect(progressItems().length).toBe(3);
  });

  it('should display the correct step names', () => {
    const labels = fixture.nativeElement.querySelectorAll(
      '.progress-item small',
    );

    expect(labels[0].textContent.trim()).toBe('Business Information');
    expect(labels[1].textContent.trim()).toBe('Owner Information');
    expect(labels[2].textContent.trim()).toBe('Review');
  });

  it('should display sequential step numbers', () => {
    const numbers = fixture.nativeElement.querySelectorAll(
      '.progress-item > span',
    );

    expect(numbers[0].textContent.trim()).toBe('1');
    expect(numbers[1].textContent.trim()).toBe('2');
    expect(numbers[2].textContent.trim()).toBe('3');
  });

  it('should mark the current step as active', () => {
    const items = progressItems();

    expect(items[0].classList.contains('active')).toBe(true);
    expect(items[1].classList.contains('active')).toBe(false);
    expect(items[2].classList.contains('active')).toBe(false);
  });

  it('should set aria-current on the current step only', () => {
    const items = progressItems();

    expect(items[0].getAttribute('aria-current')).toBe('step');
    expect(items[1].getAttribute('aria-current')).toBeNull();
    expect(items[2].getAttribute('aria-current')).toBeNull();
  });

  it('should mark earlier steps as completed', () => {
    fixture.componentRef.setInput('currentStep', 2);
    fixture.detectChanges();

    const items = progressItems();

    expect(items[0].classList.contains('completed')).toBe(true);
    expect(items[1].classList.contains('completed')).toBe(true);
    expect(items[2].classList.contains('completed')).toBe(false);
  });

  it('should update the active step when currentStep changes', () => {
    fixture.componentRef.setInput('currentStep', 1);
    fixture.detectChanges();

    const items = progressItems();

    expect(items[0].classList.contains('completed')).toBe(true);
    expect(items[1].classList.contains('active')).toBe(true);
    expect(items[2].classList.contains('active')).toBe(false);

    expect(items[1].getAttribute('aria-current')).toBe('step');
  });

  it('should render the progress container', () => {
    expect(fixture.nativeElement.querySelector('.progress')).toBeTruthy();
  });

  it('should render no items when steps is empty', () => {
    fixture.componentRef.setInput('steps', []);
    fixture.detectChanges();

    expect(progressItems().length).toBe(0);
  });
});
