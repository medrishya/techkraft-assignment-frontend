import 'zone.js';
import 'zone.js/testing';

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, it, expect, beforeEach } from 'vitest';

import { ReviewHeaderComponent } from './review-header.component';
import type { Application } from '../../models/reviewer.model';

describe('ReviewHeaderComponent', () => {
  let fixture: ComponentFixture<ReviewHeaderComponent>;
  let component: ReviewHeaderComponent;

  const mockApplication = {
    id: 'app-123',
    business_name: 'Acme Trading Pvt. Ltd.',
    application_status: 'UNDER_REVIEW',
    risk_status: 'NEEDS_INFO',
  } as Application;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReviewHeaderComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(ReviewHeaderComponent);
    component = fixture.componentInstance;
  });

  function setApplication(application: Application | null): void {
    fixture.componentRef.setInput('application', application);
    fixture.detectChanges();
  }

  function getElement<T extends HTMLElement>(selector: string): T | null {
    return fixture.nativeElement.querySelector(selector) as T | null;
  }

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display the page heading', () => {
    fixture.detectChanges();

    expect(getElement('h1')?.textContent?.trim()).toBe('Application Review');
  });

  it('should display a link back to the dashboard', () => {
    fixture.detectChanges();

    const link = getElement<HTMLAnchorElement>('.back-link');

    expect(link).not.toBeNull();
    expect(link?.textContent?.trim()).toContain('Back to dashboard');
    expect(link?.getAttribute('routerLink')).toBe('/dashboard');
  });

  it('should not display application details when application is null', () => {
    setApplication(null);

    expect(getElement('.subtitle')).toBeNull();
    expect(getElement('.status-group')).toBeNull();
    expect(getElement('h1')).not.toBeNull();
  });

  it('should display the business name and application ID', () => {
    setApplication(mockApplication);

    expect(getElement('.subtitle')?.textContent).toContain(
      'Acme Trading Pvt. Ltd.',
    );
    expect(getElement('.application-id')?.textContent?.trim()).toBe('app-123');
  });

  it('should display formatted application and risk statuses', () => {
    setApplication(mockApplication);

    const statuses = Array.from(
      fixture.nativeElement.querySelectorAll(
        '.status-group .status',
      ) as NodeListOf<HTMLSpanElement>,
    ).map((element) => element.textContent?.trim());

    expect(statuses).toEqual(['Under Review', 'Risk: Needs Info']);
  });

  it('should apply the approved class to an approved application status', () => {
    setApplication({
      ...mockApplication,
      application_status: 'APPROVED',
    } as Application);

    const applicationStatus = getElement<HTMLSpanElement>(
      '.status-group .status:first-child',
    );

    expect(applicationStatus?.classList.contains('approved')).toBe(true);
    expect(applicationStatus?.classList.contains('rejected')).toBe(false);
  });

  it('should apply the rejected class to a rejected application status', () => {
    setApplication({
      ...mockApplication,
      application_status: 'REJECTED',
    } as Application);

    const applicationStatus = getElement<HTMLSpanElement>(
      '.status-group .status:first-child',
    );

    expect(applicationStatus?.classList.contains('rejected')).toBe(true);
    expect(applicationStatus?.classList.contains('approved')).toBe(false);
  });

  it('should apply the approved class to an approved risk status', () => {
    setApplication({
      ...mockApplication,
      risk_status: 'APPROVED',
    } as Application);

    const riskStatus = getElement<HTMLSpanElement>(
      '.status-group .status:last-child',
    );

    expect(riskStatus?.textContent?.trim()).toBe('Risk: Approved');
    expect(riskStatus?.classList.contains('approved')).toBe(true);
    expect(riskStatus?.classList.contains('rejected')).toBe(false);
    expect(riskStatus?.classList.contains('needs-info')).toBe(false);
  });

  it('should apply the rejected class to a rejected risk status', () => {
    setApplication({
      ...mockApplication,
      risk_status: 'REJECTED',
    } as Application);

    const riskStatus = getElement<HTMLSpanElement>(
      '.status-group .status:last-child',
    );

    expect(riskStatus?.textContent?.trim()).toBe('Risk: Rejected');
    expect(riskStatus?.classList.contains('rejected')).toBe(true);
  });

  it('should apply the needs-info class to a NEEDS_INFO risk status', () => {
    setApplication({
      ...mockApplication,
      risk_status: 'NEEDS_INFO',
    } as Application);

    const riskStatus = getElement<HTMLSpanElement>(
      '.status-group .status:last-child',
    );

    expect(riskStatus?.classList.contains('needs-info')).toBe(true);
    expect(riskStatus?.classList.contains('approved')).toBe(false);
    expect(riskStatus?.classList.contains('rejected')).toBe(false);
  });

  describe('formatValue', () => {
    it('should convert an uppercase value to title case', () => {
      expect(component.formatValue('APPROVED')).toBe('Approved');
    });

    it('should convert underscore-separated values to title case', () => {
      expect(component.formatValue('NEEDS_MORE_INFO')).toBe('Needs More Info');
    });

    it('should handle a single word', () => {
      expect(component.formatValue('PENDING')).toBe('Pending');
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
    it('should return an em dash for null', () => {
      expect(component.formatDate(null)).toBe('—');
    });

    it('should return an em dash for undefined', () => {
      expect(component.formatDate(undefined)).toBe('—');
    });

    it('should return an em dash for an empty string', () => {
      expect(component.formatDate('')).toBe('—');
    });

    it('should return an em dash for an invalid date', () => {
      expect(component.formatDate('invalid-date')).toBe('—');
    });

    it('should format a valid date using the local date format', () => {
      const value = '2026-01-15T10:30:00.000Z';
      const expected = new Date(value).toLocaleString();

      expect(component.formatDate(value)).toBe(expected);
    });
  });

  it('should update the header when the application input changes', () => {
    setApplication(mockApplication);

    expect(getElement('.subtitle')?.textContent).toContain(
      'Acme Trading Pvt. Ltd.',
    );

    setApplication({
      ...mockApplication,
      id: 'app-456',
      business_name: 'Updated Business',
    } as Application);

    expect(getElement('.subtitle')?.textContent).toContain('Updated Business');
    expect(getElement('.application-id')?.textContent?.trim()).toBe('app-456');
  });
});
