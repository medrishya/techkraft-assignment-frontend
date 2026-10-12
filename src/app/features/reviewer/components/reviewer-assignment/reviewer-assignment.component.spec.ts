import 'zone.js';
import 'zone.js/testing';

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, FormGroup } from '@angular/forms';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { ReviewerAssignmentComponent } from './reviewer-assignment.component';
import type { Application, ReviewerOption } from '../../models/reviewer.model';

describe('ReviewerAssignmentComponent', () => {
  let fixture: ComponentFixture<ReviewerAssignmentComponent>;
  let component: ReviewerAssignmentComponent;
  let assignmentForm: FormGroup;

  const mockApplication = {
    id: 'app-123',
    business_name: 'Acme Trading Pvt. Ltd.',
    assigned_reviewer_name: 'Jane Reviewer',
  } as Application;

  const mockReviewers = [
    {
      id: 'reviewer-1',
      name: 'Jane Reviewer',
      email: 'jane@example.com',
      first_name: 'Jane',
      last_name: 'Reviewer',
    },
    {
      id: 'reviewer-2',
      name: 'John Reviewer',
      email: 'john@example.com',
      first_name: 'John',
      last_name: 'Reviewer',
    },
  ] as ReviewerOption[];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReviewerAssignmentComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ReviewerAssignmentComponent);
    component = fixture.componentInstance;

    assignmentForm = new FormGroup({
      reviewerId: new FormControl('reviewer-1'),
    });

    fixture.componentRef.setInput('application', mockApplication);
    fixture.componentRef.setInput('reviewers', mockReviewers);
    fixture.componentRef.setInput('assignmentForm', assignmentForm);

    fixture.detectChanges();
  });

  function setInput(name: string, value: unknown): void {
    fixture.componentRef.setInput(name, value);
    fixture.detectChanges();
  }

  function getElement<T extends HTMLElement>(selector: string): T | null {
    return fixture.nativeElement.querySelector(selector) as T | null;
  }

  function getElements<T extends HTMLElement>(selector: string): T[] {
    return Array.from(
      fixture.nativeElement.querySelectorAll(selector) as NodeListOf<T>,
    );
  }

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display the section heading and description', () => {
    expect(getElement('h2')?.textContent?.trim()).toBe('Reassign Reviewer');

    expect(getElement('.muted')?.textContent?.trim()).toBe(
      'Change the reviewer responsible for this application.',
    );
  });

  it('should display the currently assigned reviewer', () => {
    expect(getElement('.current-assignment-label')?.textContent?.trim()).toBe(
      'Currently assigned',
    );

    expect(getElement('.current-assignment strong')?.textContent?.trim()).toBe(
      'Jane Reviewer',
    );
  });

  it('should display Unassigned when there is no assigned reviewer name', () => {
    setInput('application', {
      ...mockApplication,
      assigned_reviewer_name: undefined,
    } as Application);

    expect(getElement('.current-assignment strong')?.textContent?.trim()).toBe(
      'Unassigned',
    );
  });

  it('should render the reviewer select and its Unassigned option', () => {
    const select = getElement<HTMLSelectElement>('#assigned_reviewer_id');

    expect(select).not.toBeNull();
    expect(select?.options[0].value).toBe('');
    expect(select?.options[0].textContent?.trim()).toBe('Unassigned');
  });

  it('should display all available reviewers with their emails', () => {
    const options = getElements<HTMLOptionElement>(
      '#assigned_reviewer_id option',
    );

    expect(options).toHaveLength(3);

    expect(options[1].value).toBe('reviewer-1');
    expect(options[1].textContent?.replace(/\s+/g, ' ').trim()).toBe(
      'Jane Reviewer (jane@example.com)',
    );

    expect(options[2].value).toBe('reviewer-2');
    expect(options[2].textContent?.replace(/\s+/g, ' ').trim()).toBe(
      'John Reviewer (john@example.com)',
    );
  });

  it('should display the reviewer name without an email when email is missing', () => {
    setInput('reviewers', [
      {
        id: 'reviewer-3',
        name: 'Alex Reviewer',
        email: undefined,
        first_name: 'Alex',
        last_name: 'Reviewer',
      },
    ] as ReviewerOption[]);

    const options = getElements<HTMLOptionElement>(
      '#assigned_reviewer_id option',
    );

    expect(options[1].textContent?.trim()).toBe('Alex Reviewer');
  });

  it('should display the loading message while reviewers are loading', () => {
    setInput('loadingReviewers', true);

    expect(
      getElement('.assignment-card form .muted')?.textContent?.trim(),
    ).toBe('Loading available reviewers...');

    expect(getElement('.inline-warning')).toBeNull();
  });

  it('should disable the reviewer select while reviewers are loading', async () => {
    setInput('loadingReviewers', true);

    await fixture.whenStable();
    fixture.detectChanges();

    expect(
      getElement<HTMLSelectElement>('#assigned_reviewer_id')?.disabled,
    ).toBe(true);
  });

  it('should display a warning when no reviewers are available', () => {
    setInput('reviewers', []);

    expect(getElement('.inline-warning')?.textContent?.trim()).toBe(
      'No reviewers were returned by the API.',
    );
  });

  it('should not display the empty reviewers warning while loading', () => {
    setInput('reviewers', []);
    setInput('loadingReviewers', true);

    expect(getElement('.inline-warning')).toBeNull();

    expect(
      getElement('.assignment-card form .muted')?.textContent?.trim(),
    ).toBe('Loading available reviewers...');
  });

  it('should show Save Assignment when not saving', () => {
    expect(
      getElement<HTMLButtonElement>('.primary-button')?.textContent?.trim(),
    ).toBe('Save Assignment');
  });

  it('should show Saving assignment while saving', () => {
    setInput('savingAssignment', true);

    expect(
      getElement<HTMLButtonElement>('.primary-button')?.textContent?.trim(),
    ).toBe('Saving assignment...');
  });

  it('should disable the select while saving', () => {
    setInput('savingAssignment', true);

    expect(
      getElement<HTMLSelectElement>('#assigned_reviewer_id')?.disabled,
    ).toBe(true);
  });

  it('should disable the submit button while saving', () => {
    setInput('savingAssignment', true);

    expect(getElement<HTMLButtonElement>('.primary-button')?.disabled).toBe(
      true,
    );
  });

  it('should disable the submit button while reviewers are loading', () => {
    setInput('loadingReviewers', true);

    expect(getElement<HTMLButtonElement>('.primary-button')?.disabled).toBe(
      true,
    );
  });

  it('should disable the submit button when the assignment is unchanged', () => {
    setInput('unchanged', true);

    expect(getElement<HTMLButtonElement>('.primary-button')?.disabled).toBe(
      true,
    );
  });

  it('should enable the submit button when the form can be submitted', () => {
    setInput('unchanged', false);

    expect(getElement<HTMLButtonElement>('.primary-button')?.disabled).toBe(
      false,
    );
  });

  it('should emit submitAssignment when the form is submitted', () => {
    const submitSpy = vi.fn();
    const subscription = component.submitAssignment.subscribe(submitSpy);

    const form = getElement<HTMLFormElement>('form')!;

    form.dispatchEvent(
      new Event('submit', {
        bubbles: true,
        cancelable: true,
      }),
    );

    expect(submitSpy).toHaveBeenCalledTimes(1);

    subscription.unsubscribe();
  });

  it('should update the form control when a different reviewer is selected', () => {
    const select = getElement<HTMLSelectElement>('#assigned_reviewer_id')!;

    select.value = 'reviewer-2';
    select.dispatchEvent(new Event('change', { bubbles: true }));
    fixture.detectChanges();

    expect(assignmentForm.get('reviewerId')?.value).toBe('reviewer-2');
  });

  it('should allow selecting Unassigned', () => {
    const select = getElement<HTMLSelectElement>('#assigned_reviewer_id')!;

    select.value = '';
    select.dispatchEvent(new Event('change', { bubbles: true }));
    fixture.detectChanges();

    expect(assignmentForm.get('reviewerId')?.value).toBe('');
  });

  describe('reviewerDisplayName', () => {
    it('should prefer the supplied name', () => {
      expect(
        component.reviewerDisplayName({
          id: 'reviewer-1',
          name: '  Jane Reviewer  ',
          email: 'jane@example.com',
          first_name: 'Jane',
          last_name: 'Reviewer',
        } as ReviewerOption),
      ).toBe('Jane Reviewer');
    });

    it('should fall back to first and last name', () => {
      expect(
        component.reviewerDisplayName({
          id: 'reviewer-2',
          name: '',
          email: 'john@example.com',
          first_name: 'John',
          last_name: 'Reviewer',
        } as ReviewerOption),
      ).toBe('John Reviewer');
    });

    it('should handle a first name without a last name', () => {
      expect(
        component.reviewerDisplayName({
          id: 'reviewer-3',
          name: undefined,
          first_name: 'Alex',
          last_name: undefined,
          email: 'alex@example.com',
        } as ReviewerOption),
      ).toBe('Alex');
    });

    it('should fall back to email when names are missing', () => {
      expect(
        component.reviewerDisplayName({
          id: 'reviewer-4',
          name: undefined,
          first_name: undefined,
          last_name: undefined,
          email: 'reviewer@example.com',
        } as ReviewerOption),
      ).toBe('reviewer@example.com');
    });

    it('should fall back to reviewer ID when all names and email are missing', () => {
      expect(
        component.reviewerDisplayName({
          id: 'reviewer-5',
          name: undefined,
          first_name: undefined,
          last_name: undefined,
          email: undefined,
        } as ReviewerOption),
      ).toBe('reviewer-5');
    });

    it('should ignore whitespace-only names and use the next fallback', () => {
      expect(
        component.reviewerDisplayName({
          id: 'reviewer-6',
          name: '   ',
          first_name: '   ',
          last_name: '',
          email: 'fallback@example.com',
        } as ReviewerOption),
      ).toBe('fallback@example.com');
    });
  });
});
