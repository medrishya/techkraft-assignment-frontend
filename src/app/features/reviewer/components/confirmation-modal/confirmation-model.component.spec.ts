import 'zone.js';
import 'zone.js/testing';

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { ConfirmationModalComponent } from './confirmation-modal.component';

describe('ConfirmationModalComponent', () => {
  let fixture: ComponentFixture<ConfirmationModalComponent>;
  let component: ConfirmationModalComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConfirmationModalComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ConfirmationModalComponent);
    component = fixture.componentInstance;

    fixture.detectChanges();
  });

  function setInputs(
    inputs: {
      visible?: boolean;
      title?: string;
      message?: string;
      busy?: boolean;
    } = {},
  ): void {
    if (inputs.visible !== undefined) {
      fixture.componentRef.setInput('visible', inputs.visible);
    }

    if (inputs.title !== undefined) {
      fixture.componentRef.setInput('title', inputs.title);
    }

    if (inputs.message !== undefined) {
      fixture.componentRef.setInput('message', inputs.message);
    }

    if (inputs.busy !== undefined) {
      fixture.componentRef.setInput('busy', inputs.busy);
    }

    fixture.detectChanges();
  }

  function getElement<T extends HTMLElement>(selector: string): T | null {
    return fixture.nativeElement.querySelector(selector) as T | null;
  }

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should default to hidden', () => {
    expect(component.visible()).toBe(false);
    expect(getElement('.modal')).toBeNull();
    expect(getElement('.modal-backdrop')).toBeNull();
  });

  it('should display the modal and backdrop when visible', () => {
    setInputs({ visible: true });

    expect(getElement('.modal')).not.toBeNull();
    expect(getElement('.modal-backdrop')).not.toBeNull();
  });

  it('should hide the modal and backdrop when visibility is false', () => {
    setInputs({ visible: true });
    setInputs({ visible: false });

    expect(getElement('.modal')).toBeNull();
    expect(getElement('.modal-backdrop')).toBeNull();
  });

  it('should display the provided title and message', () => {
    setInputs({
      visible: true,
      title: 'Delete application',
      message: 'Are you sure you want to delete this application?',
    });

    expect(getElement('#confirmModalTitle')?.textContent?.trim()).toBe(
      'Delete application',
    );
    expect(getElement('.modal-body')?.textContent?.trim()).toBe(
      'Are you sure you want to delete this application?',
    );
  });

  it('should display empty title and message by default', () => {
    setInputs({ visible: true });

    expect(getElement('#confirmModalTitle')?.textContent?.trim()).toBe('');
    expect(getElement('.modal-body')?.textContent?.trim()).toBe('');
  });

  it('should have the expected dialog accessibility attributes', () => {
    setInputs({ visible: true });

    const modal = getElement<HTMLDivElement>('.modal');

    expect(modal?.getAttribute('role')).toBe('dialog');
    expect(modal?.getAttribute('aria-modal')).toBe('true');
    expect(modal?.getAttribute('aria-labelledby')).toBe('confirmModalTitle');
    expect(modal?.getAttribute('tabindex')).toBe('-1');
  });

  it('should emit cancel when the modal backdrop is clicked', () => {
    const cancelSpy = vi.fn();
    component.cancel.subscribe(cancelSpy);

    setInputs({ visible: true });

    getElement<HTMLDivElement>('.modal')!.click();

    expect(cancelSpy).toHaveBeenCalledTimes(1);
  });

  it('should not emit cancel when the modal dialog content is clicked', () => {
    const cancelSpy = vi.fn();
    component.cancel.subscribe(cancelSpy);

    setInputs({ visible: true });

    getElement<HTMLDivElement>('.modal-dialog')!.click();

    expect(cancelSpy).not.toHaveBeenCalled();
  });

  it('should emit cancel when the close button is clicked', () => {
    const cancelSpy = vi.fn();
    component.cancel.subscribe(cancelSpy);

    setInputs({ visible: true });

    getElement<HTMLButtonElement>('.btn-close')!.click();

    expect(cancelSpy).toHaveBeenCalledTimes(1);
  });

  it('should emit cancel when the Cancel button is clicked', () => {
    const cancelSpy = vi.fn();
    component.cancel.subscribe(cancelSpy);

    setInputs({ visible: true });

    const buttons = fixture.nativeElement.querySelectorAll(
      '.modal-footer button',
    ) as NodeListOf<HTMLButtonElement>;

    buttons[0].click();

    expect(cancelSpy).toHaveBeenCalledTimes(1);
  });

  it('should emit confirm when the Confirm button is clicked', () => {
    const confirmSpy = vi.fn();
    component.confirm.subscribe(confirmSpy);

    setInputs({ visible: true });

    const buttons = fixture.nativeElement.querySelectorAll(
      '.modal-footer button',
    ) as NodeListOf<HTMLButtonElement>;

    buttons[1].click();

    expect(confirmSpy).toHaveBeenCalledTimes(1);
  });

  it('should not emit cancel when the close button is clicked while busy', () => {
    const cancelSpy = vi.fn();
    component.cancel.subscribe(cancelSpy);

    setInputs({ visible: true, busy: true });

    const closeButton = getElement<HTMLButtonElement>('.btn-close')!;

    expect(closeButton.disabled).toBe(true);

    closeButton.click();

    expect(cancelSpy).not.toHaveBeenCalled();
  });

  it('should disable the Cancel button while busy', () => {
    setInputs({ visible: true, busy: true });

    const buttons = fixture.nativeElement.querySelectorAll(
      '.modal-footer button',
    ) as NodeListOf<HTMLButtonElement>;

    expect(buttons[0].disabled).toBe(true);
  });

  it('should disable the Confirm button while busy', () => {
    setInputs({ visible: true, busy: true });

    const buttons = fixture.nativeElement.querySelectorAll(
      '.modal-footer button',
    ) as NodeListOf<HTMLButtonElement>;

    expect(buttons[1].disabled).toBe(true);
  });

  it('should not emit confirm when the Confirm button is clicked while busy', () => {
    const confirmSpy = vi.fn();
    component.confirm.subscribe(confirmSpy);

    setInputs({ visible: true, busy: true });

    const buttons = fixture.nativeElement.querySelectorAll(
      '.modal-footer button',
    ) as NodeListOf<HTMLButtonElement>;

    buttons[1].click();

    expect(confirmSpy).not.toHaveBeenCalled();
  });

  it('should re-enable buttons when busy changes to false', () => {
    setInputs({ visible: true, busy: true });

    setInputs({ busy: false });

    const closeButton = getElement<HTMLButtonElement>('.btn-close')!;
    const buttons = fixture.nativeElement.querySelectorAll(
      '.modal-footer button',
    ) as NodeListOf<HTMLButtonElement>;

    expect(closeButton.disabled).toBe(false);
    expect(buttons[0].disabled).toBe(false);
    expect(buttons[1].disabled).toBe(false);
  });

  it('should emit cancel again when clicked repeatedly while not busy', () => {
    const cancelSpy = vi.fn();
    component.cancel.subscribe(cancelSpy);

    setInputs({ visible: true });

    getElement<HTMLButtonElement>('.btn-close')!.click();
    getElement<HTMLButtonElement>('.modal-footer .btn-secondary')!.click();

    expect(cancelSpy).toHaveBeenCalledTimes(2);
  });

  it('should update the title and message when inputs change', () => {
    setInputs({
      visible: true,
      title: 'First title',
      message: 'First message',
    });

    setInputs({
      title: 'Updated title',
      message: 'Updated message',
    });

    expect(getElement('#confirmModalTitle')?.textContent?.trim()).toBe(
      'Updated title',
    );
    expect(getElement('.modal-body')?.textContent?.trim()).toBe(
      'Updated message',
    );
  });
});
