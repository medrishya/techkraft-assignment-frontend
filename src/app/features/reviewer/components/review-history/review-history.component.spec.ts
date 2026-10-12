import 'zone.js';
import 'zone.js/testing';

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { ReviewHistoryComponent } from './review-history.component';
import type { Review } from '../../models/reviewer.model';

describe('ReviewHistoryComponent', () => {
  let fixture: ComponentFixture<ReviewHistoryComponent>;
  let component: ReviewHistoryComponent;

  const mockReviews = [
    {
      id: 'review-1',
      decision: 'APPROVE',
      created_at: '2026-01-15T10:30:00.000Z',
      actor_name: 'Jane Reviewer',
      actor_id: 'user-1',
      comments: 'All documents verified.',
      application_status: 'APPROVED',
      risk_status: 'APPROVED',
    },
    {
      id: 'review-2',
      decision: 'REQUEST_INFO',
      created_at: '2026-01-14T09:00:00.000Z',
      actor_name: null,
      actor_id: 'user-2',
      comments: null,
      application_status: 'UNDER_REVIEW',
      risk_status: 'NEEDS_INFO',
    },
  ] as Review[];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReviewHistoryComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ReviewHistoryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  function setReviews(reviews: Review[]): void {
    fixture.componentRef.setInput('reviews', reviews);
    fixture.detectChanges();
  }

  function setLoading(loading: boolean): void {
    fixture.componentRef.setInput('loadingReviews', loading);
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
    expect(getElement('h2')?.textContent?.trim()).toBe('Review History');
    expect(getElement('.section-heading p')?.textContent?.trim()).toBe(
      'Previous decisions and review comments',
    );
  });

  it('should display the empty state when there are no reviews', () => {
    setReviews([]);

    expect(getElement('.empty-state')?.textContent?.trim()).toBe(
      'No review decisions have been recorded yet.',
    );
    expect(getElement('.timeline')).toBeNull();
  });

  it('should display the loading message while reviews are loading', () => {
    setLoading(true);

    expect(getElement('.muted')?.textContent?.trim()).toBe(
      'Loading review history...',
    );
    expect(getElement('.timeline')).toBeNull();
    expect(getElement('.empty-state')).toBeNull();
  });

  it('should show Refresh when not loading', () => {
    const button = getElement<HTMLButtonElement>('.secondary-button');

    expect(button?.textContent?.trim()).toBe('Refresh');
    expect(button?.disabled).toBe(false);
  });

  it('should show Refreshing and disable the button while loading', () => {
    setLoading(true);

    const button = getElement<HTMLButtonElement>('.secondary-button');

    expect(button?.textContent?.trim()).toBe('Refreshing...');
    expect(button?.disabled).toBe(true);
  });

  it('should emit refresh when the refresh button is clicked', () => {
    const refreshSpy = vi.fn();
    const subscription = component.refresh.subscribe(refreshSpy);

    getElement<HTMLButtonElement>('.secondary-button')?.click();

    expect(refreshSpy).toHaveBeenCalledTimes(1);

    subscription.unsubscribe();
  });

  it('should render all review records', () => {
    setReviews(mockReviews);

    expect(getElements('article.timeline-item')).toHaveLength(2);
  });

  it('should display formatted decisions', () => {
    setReviews(mockReviews);

    const decisions = getElements<HTMLElement>('.timeline-header strong').map(
      (element) => element.textContent?.trim(),
    );

    expect(decisions).toEqual(['Approve', 'Request Info']);
  });

  it('should display formatted review dates', () => {
    setReviews(mockReviews);

    const dates = getElements<HTMLTimeElement>('.timeline-header time').map(
      (element) => element.textContent?.trim(),
    );

    expect(dates).toEqual([
      new Date(mockReviews[0].created_at).toLocaleString(),
      new Date(mockReviews[1].created_at).toLocaleString(),
    ]);
  });

  it('should display the actor name when available', () => {
    setReviews(mockReviews);

    const actors = getElements<HTMLElement>('.review-actor');

    expect(actors[0].textContent?.trim()).toBe('Jane Reviewer');
  });

  it('should fall back to actor ID when the actor name is missing', () => {
    setReviews(mockReviews);

    const actors = getElements<HTMLElement>('.review-actor');

    expect(actors[1].textContent?.trim()).toBe('user-2');
  });

  it('should fall back to Reviewer when both actor name and ID are missing', () => {
    setReviews([
      {
        ...mockReviews[0],
        actor_name: undefined,
        actor_id: undefined,
      } as Review,
    ]);

    expect(getElement('.review-actor')?.textContent?.trim()).toBe('Reviewer');
  });

  it('should display comments when present', () => {
    setReviews(mockReviews);

    const comments = getElements<HTMLElement>('.review-comments');

    expect(comments).toHaveLength(1);
    expect(comments[0].textContent?.trim()).toBe('All documents verified.');
  });

  it('should not render a comments element when comments are missing', () => {
    setReviews([
      {
        ...mockReviews[1],
        comments: undefined,
      } as Review,
    ]);

    expect(getElement('.review-comments')).toBeNull();
  });

  it('should display formatted application and risk statuses', () => {
    setReviews(mockReviews);

    const statusGroups = getElements<HTMLElement>('.review-status');

    expect(statusGroups).toHaveLength(2);

    expect(statusGroups[0].querySelector('span')?.textContent?.trim()).toBe(
      'Application: Approved',
    );

    expect(
      statusGroups[0].querySelectorAll('span')[1]?.textContent?.trim(),
    ).toBe('Risk: Approved');

    expect(statusGroups[1].querySelector('span')?.textContent?.trim()).toBe(
      'Application: Under Review',
    );

    expect(
      statusGroups[1].querySelectorAll('span')[1]?.textContent?.trim(),
    ).toBe('Risk: Needs Info');
  });
  it('should use REVIEW when a decision is missing', () => {
    setReviews([
      {
        ...mockReviews[0],
        decision: undefined,
      } as Review,
    ]);

    expect(getElement('.timeline-header strong')?.textContent?.trim()).toBe(
      'Review',
    );
  });
  describe('formatValue', () => {
    it('should format uppercase values', () => {
      expect(component.formatValue('APPROVED')).toBe('Approved');
    });

    it('should format underscore-separated values', () => {
      expect(component.formatValue('NEEDS_MORE_INFO')).toBe('Needs More Info');
    });

    it('should return an em dash for null', () => {
      expect(component.formatValue(null)).toBe('—');
    });

    it('should return an em dash for undefined', () => {
      expect(component.formatValue(undefined)).toBe('—');
    });

    it('should return an em dash for an empty string', () => {
      expect(component.formatValue('')).toBe('—');
    });
  });

  describe('formatDate', () => {
    it('should format a valid date using the local date format', () => {
      const value = '2026-01-15T10:30:00.000Z';

      expect(component.formatDate(value)).toBe(
        new Date(value).toLocaleString(),
      );
    });

    it('should return an em dash for an invalid date', () => {
      expect(component.formatDate('invalid-date')).toBe('—');
    });

    it('should return an em dash for null', () => {
      expect(component.formatDate(null)).toBe('—');
    });

    it('should return an em dash for undefined', () => {
      expect(component.formatDate(undefined)).toBe('—');
    });

    it('should return an em dash for an empty string', () => {
      expect(component.formatDate('')).toBe('—');
    });
  });

  it('should update the timeline when the reviews input changes', () => {
    setReviews([mockReviews[0]]);

    expect(getElements('article.timeline-item')).toHaveLength(1);

    setReviews(mockReviews);

    expect(getElements('article.timeline-item')).toHaveLength(2);
  });

  it('should show the empty state after reviews are cleared', () => {
    setReviews(mockReviews);
    setReviews([]);

    expect(getElement('.empty-state')).not.toBeNull();
    expect(getElement('.timeline')).toBeNull();
  });
});
