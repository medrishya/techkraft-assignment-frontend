import 'zone.js';
import 'zone.js/testing';

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, FormGroup } from '@angular/forms';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { ReviewDecisionComponent } from './review-decision.component';

describe('ReviewDecisionComponent', () => {
  let fixture: ComponentFixture<ReviewDecisionComponent>;
  let component: ReviewDecisionComponent;
  let reviewForm: FormGroup;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReviewDecisionComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ReviewDecisionComponent);
    component = fixture.componentInstance;

    reviewForm = new FormGroup({
      decision: new FormControl('APPROVE'),
      comments: new FormControl(''),
    });

    fixture.componentRef.setInput('reviewForm', reviewForm);
    fixture.componentRef.setInput('canReview', true);

    fixture.detectChanges();
  });

  function setInputs(inputs: {
    canReview?: boolean;
    submitting?: boolean;
    loading?: boolean;
  }): void {
    if (inputs.canReview !== undefined) {
      fixture.componentRef.setInput('canReview', inputs.canReview);
    }

    if (inputs.submitting !== undefined) {
      fixture.componentRef.setInput('submitting', inputs.submitting);
    }

    if (inputs.loading !== undefined) {
      fixture.componentRef.setInput('loading', inputs.loading);
    }

    fixture.detectChanges();
  }

  function getElement<T extends HTMLElement>(selector: string): T | null {
    return fixture.nativeElement.querySelector(selector) as T | null;
  }

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display the review decision heading and description', () => {
    expect(fixture.nativeElement.textContent).toContain('Review Decision');
    expect(fixture.nativeElement.textContent).toContain(
      'Record your decision for this application.',
    );
  });

  it('should display the review form when canReview is true', () => {
    expect(getElement('form')).not.toBeNull();
    expect(getElement('#decision')).not.toBeNull();
    expect(getElement('#comments')).not.toBeNull();
    expect(getElement('.primary-button')).not.toBeNull();
  });

  it('should display a restricted message when canReview is false', () => {
    setInputs({ canReview: false });

    expect(getElement('form')).toBeNull();
    expect(getElement('.restricted')?.textContent?.trim()).toBe(
      'Review actions are unavailable for your role.',
    );
  });

  it('should provide all three decision options', () => {
    const options = Array.from(
      getElement<HTMLSelectElement>('#decision')!.options,
    ).map((option) => ({
      value: option.value,
      text: option.textContent?.trim(),
    }));

    expect(options).toEqual([
      { value: 'APPROVE', text: 'Approve' },
      { value: 'REJECT', text: 'Reject' },
      { value: 'REQUEST_INFO', text: 'Request Information' },
    ]);
  });

  it('should bind the decision select to the form', () => {
    const select = getElement<HTMLSelectElement>('#decision')!;

    expect(reviewForm.get('decision')?.value).toBe('APPROVE');
    expect(select.value).toBe('APPROVE');
  });

  it('should bind the comments textarea to the form', () => {
    const textarea = getElement<HTMLTextAreaElement>('#comments')!;

    textarea.value = 'Please verify the submitted documents.';
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();

    expect(reviewForm.get('comments')?.value).toBe(
      'Please verify the submitted documents.',
    );
  });

  it('should configure the comments textarea with a maximum length of 2000', () => {
    const textarea = getElement<HTMLTextAreaElement>('#comments')!;

    expect(textarea.maxLength).toBe(2000);
    expect(textarea.rows).toBe(5);
  });

  it('should display approval guidance for APPROVE', () => {
    reviewForm.get('decision')?.setValue('APPROVE');
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain(
      'The application and risk statuses will become approved.',
    );
  });

  it('should display rejection guidance for REJECT', () => {
    reviewForm.get('decision')?.setValue('REJECT');
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain(
      'The application and risk statuses will become rejected.',
    );
  });

  it('should display information-request guidance for REQUEST_INFO', () => {
    reviewForm.get('decision')?.setValue('REQUEST_INFO');
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain(
      'The application status will become under review and the risk status will become need info.',
    );
  });

  it('should update decision guidance when the selected decision changes', () => {
    reviewForm.get('decision')?.setValue('APPROVE');
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain(
      'The application and risk statuses will become approved.',
    );

    reviewForm.get('decision')?.setValue('REJECT');
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain(
      'The application and risk statuses will become rejected.',
    );
  });

  it('should initialize the comment length to zero', () => {
    expect(component.commentLength).toBe(0);
    expect(getElement('.character-count')?.textContent?.trim()).toBe('0/2000');
  });

  it('should count the current comment characters', () => {
    reviewForm.get('comments')?.setValue('Documents verified');
    fixture.detectChanges();

    expect(component.commentLength).toBe(18);
    expect(getElement('.character-count')?.textContent?.trim()).toBe('18/2000');
  });

  it('should return zero when comments are null', () => {
    reviewForm.get('comments')?.setValue(null);

    expect(component.commentLength).toBe(0);
  });

  it('should return zero when comments are undefined', () => {
    reviewForm.get('comments')?.setValue(undefined);

    expect(component.commentLength).toBe(0);
  });

  it('should update the character count when comments change', async () => {
    const textarea = getElement<HTMLTextAreaElement>('#comments')!;

    textarea.value = 'This is a longer review';
    textarea.dispatchEvent(new Event('input', { bubbles: true }));

    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(
      fixture.nativeElement
        .querySelector('.character-count')
        ?.textContent?.trim(),
    ).toBe('23/2000');
  });

  it('should emit submitDecision when the form is submitted', () => {
    const submitSpy = vi.fn();
    component.submitDecision.subscribe(submitSpy);

    const form = getElement<HTMLFormElement>('form')!;

    form.dispatchEvent(
      new Event('submit', { bubbles: true, cancelable: true }),
    );

    expect(submitSpy).toHaveBeenCalledTimes(1);
  });

  it('should not render the submit form when review is restricted', () => {
    setInputs({ canReview: false });

    expect(getElement('form')).toBeNull();
    expect(getElement('.primary-button')).toBeNull();
  });

  it('should disable the submit button while submitting', () => {
    setInputs({ submitting: true });

    const button = getElement<HTMLButtonElement>('.primary-button')!;

    expect(button.disabled).toBe(true);
    expect(button.textContent?.trim()).toBe('Submitting...');
  });

  it('should disable the submit button while loading', () => {
    setInputs({ loading: true });

    const button = getElement<HTMLButtonElement>('.primary-button')!;

    expect(button.disabled).toBe(true);
    expect(button.textContent?.trim()).toBe('Submit Review Decision');
  });

  it('should disable the submit button when submitting and loading', () => {
    setInputs({ submitting: true, loading: true });

    const button = getElement<HTMLButtonElement>('.primary-button')!;

    expect(button.disabled).toBe(true);
    expect(button.textContent?.trim()).toBe('Submitting...');
  });

  it('should enable the submit button when neither submitting nor loading', () => {
    setInputs({ submitting: false, loading: false });

    const button = getElement<HTMLButtonElement>('.primary-button')!;

    expect(button.disabled).toBe(false);
    expect(button.textContent?.trim()).toBe('Submit Review Decision');
  });

  it('should respond when the decision is changed through the select', () => {
    const select = getElement<HTMLSelectElement>('#decision')!;

    select.value = 'REJECT';
    select.dispatchEvent(new Event('change', { bubbles: true }));
    fixture.detectChanges();

    expect(reviewForm.get('decision')?.value).toBe('REJECT');
    expect(fixture.nativeElement.textContent).toContain(
      'The application and risk statuses will become rejected.',
    );
  });
});
