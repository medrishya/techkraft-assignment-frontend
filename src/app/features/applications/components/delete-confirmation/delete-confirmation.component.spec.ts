import 'zone.js';
import 'zone.js/testing';

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DeleteConfirmationComponent } from './delete-confirmation.component';
import { Application } from '../../models/application.model';

describe('DeleteConfirmationComponent', () => {
  let fixture: ComponentFixture<DeleteConfirmationComponent>;
  let component: DeleteConfirmationComponent;

  const mockApplication = {
    id: 'app-1',
    business_name: 'Acme Trading',
    legal_business_name: 'Acme Trading Pvt. Ltd.',
    owner_name: 'John Doe',
  } as unknown as Application;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DeleteConfirmationComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DeleteConfirmationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  function setInput<K extends 'open' | 'application' | 'deleting'>(
    name: K,
    value: K extends 'open'
      ? boolean
      : K extends 'application'
        ? Application | null
        : boolean,
  ): void {
    fixture.componentRef.setInput(name, value);
    fixture.detectChanges();
  }

  function getText(): string {
    return (fixture.nativeElement as HTMLElement).textContent ?? '';
  }

  function getButton(label: string): HTMLButtonElement | null {
    return fixture.nativeElement.querySelector(
      `button[aria-label="${label}"]`,
    ) as HTMLButtonElement | null;
  }

  function getButtonByText(text: string): HTMLButtonElement | null {
    const buttons = Array.from(
      fixture.nativeElement.querySelectorAll('button'),
    ) as HTMLButtonElement[];

    return (
      buttons.find((button) => button.textContent?.trim().includes(text)) ??
      null
    );
  }

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should not render the modal when open is false', () => {
    expect(fixture.nativeElement.querySelector('[role="dialog"]')).toBeNull();

    expect(fixture.nativeElement.querySelector('.modal-backdrop')).toBeNull();
  });

  it('should render the modal when open is true', () => {
    setInput('open', true);

    expect(
      fixture.nativeElement.querySelector('[role="dialog"]'),
    ).not.toBeNull();

    expect(
      fixture.nativeElement.querySelector('.modal-backdrop'),
    ).not.toBeNull();

    expect(getText()).toContain('Confirm deletion');
  });

  it('should display the confirmation message and warning', () => {
    setInput('open', true);

    expect(getText()).toContain(
      'Are you sure you want to delete this application?',
    );
    expect(getText()).toContain('This action cannot be undone.');
  });

  it('should display the selected application details', () => {
    setInput('application', mockApplication);
    setInput('open', true);

    expect(getText()).toContain('Acme Trading');
    expect(getText()).toContain('Acme Trading Pvt. Ltd.');
    expect(getText()).toContain('John Doe');
    expect(getText()).toContain('Owner:');
  });

  it('should not display application details when application is null', () => {
    setInput('application', null);
    setInput('open', true);

    expect(getText()).not.toContain('Acme Trading');
    expect(getText()).not.toContain('Acme Trading Pvt. Ltd.');
    expect(getText()).not.toContain('John Doe');
  });

  it('should expose the correct dialog accessibility attributes', () => {
    setInput('open', true);

    const dialog = fixture.nativeElement.querySelector(
      '[role="dialog"]',
    ) as HTMLElement;

    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(dialog.getAttribute('aria-labelledby')).toBe('deleteModalTitle');
    expect(dialog.getAttribute('aria-describedby')).toBe(
      'deleteModalDescription',
    );
    expect(dialog.getAttribute('tabindex')).toBe('-1');
  });

  it('should emit cancel when the Cancel button is clicked', () => {
    setInput('open', true);

    let emitted = false;
    component.cancel.subscribe(() => {
      emitted = true;
    });

    getButtonByText('Cancel')?.click();

    expect(emitted).toBe(true);
  });

  it('should emit cancel when the Close button is clicked', () => {
    setInput('open', true);

    let emitted = false;
    component.cancel.subscribe(() => {
      emitted = true;
    });

    getButton('Close')?.click();

    expect(emitted).toBe(true);
  });

  it('should emit cancel when the backdrop is clicked', () => {
    setInput('open', true);

    let emitted = false;
    component.cancel.subscribe(() => {
      emitted = true;
    });

    const backdrop = fixture.nativeElement.querySelector(
      '.modal-backdrop',
    ) as HTMLElement;

    backdrop.click();

    expect(emitted).toBe(true);
  });

  it('should emit cancel when the dialog receives Escape', () => {
    setInput('open', true);

    let emitted = false;
    component.cancel.subscribe(() => {
      emitted = true;
    });

    const dialog = fixture.nativeElement.querySelector(
      '[role="dialog"]',
    ) as HTMLElement;

    dialog.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'Escape',
        bubbles: true,
      }),
    );

    expect(emitted).toBe(true);
  });

  it('should not emit cancel when clicking inside the modal content', () => {
    setInput('open', true);

    let emitted = false;
    component.cancel.subscribe(() => {
      emitted = true;
    });

    const modalContent = fixture.nativeElement.querySelector(
      '.modal-content',
    ) as HTMLElement;

    modalContent.click();

    expect(emitted).toBe(false);
  });

  it('should emit confirm when Delete application is clicked', () => {
    setInput('application', mockApplication);
    setInput('open', true);

    let emitted = false;
    component.confirm.subscribe(() => {
      emitted = true;
    });

    getButtonByText('Delete application')?.click();

    expect(emitted).toBe(true);
  });

  it('should disable confirmation when no application is selected', () => {
    setInput('application', null);
    setInput('open', true);

    const confirmButton = getButtonByText('Delete application');

    expect(confirmButton).not.toBeNull();
    expect(confirmButton?.disabled).toBe(true);
  });

  it('should disable Cancel and Close while deleting', () => {
    setInput('application', mockApplication);
    setInput('open', true);
    setInput('deleting', true);

    const cancelButton = getButtonByText('Cancel');
    const closeButton = getButton('Close');

    expect(cancelButton?.disabled).toBe(true);
    expect(closeButton?.disabled).toBe(true);
  });

  it('should disable confirmation and display a spinner while deleting', () => {
    setInput('application', mockApplication);
    setInput('open', true);
    setInput('deleting', true);

    const confirmButton = getButtonByText('Deleting...');

    expect(confirmButton).not.toBeNull();
    expect(confirmButton?.disabled).toBe(true);

    expect(
      fixture.nativeElement.querySelector('.spinner-border'),
    ).not.toBeNull();

    expect(getText()).toContain('Deleting...');
  });

  it('should enable confirmation when an application is selected and not deleting', () => {
    setInput('application', mockApplication);
    setInput('open', true);
    setInput('deleting', false);

    const confirmButton = getButtonByText('Delete application');

    expect(confirmButton).not.toBeNull();
    expect(confirmButton?.disabled).toBe(false);
  });

  it('should not render modal content again after closing', () => {
    setInput('open', true);

    expect(
      fixture.nativeElement.querySelector('[role="dialog"]'),
    ).not.toBeNull();

    setInput('open', false);

    expect(fixture.nativeElement.querySelector('[role="dialog"]')).toBeNull();
  });
});
