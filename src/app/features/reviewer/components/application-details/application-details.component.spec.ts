import 'zone.js';
import 'zone.js/testing';

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';

import { ApplicationDetailsComponent } from './application-details.component';
import { Application } from '../../models/reviewer.model';

describe('ApplicationDetailsComponent', () => {
  let fixture: ComponentFixture<ApplicationDetailsComponent>;
  let component: ApplicationDetailsComponent;

  const mockApplication = {
    id: 'app-123',
    business_name: 'Acme Trading',
    legal_business_name: 'Acme Trading Private Limited',
    business_type: 'PRIVATE_LIMITED',
    owner_name: 'John Doe',
    owner_email: 'john@example.com',
    owner_phone: '+977-9800000000',
    processing_volume: 125000,
    processing_currency: 'NPR',
    created_by_name: 'Jane Smith',
    created_by_id: 'user-123',
    assigned_reviewer_name: 'Alex Reviewer',
    assigned_reviewer_id: 'reviewer-123',
    reviewer_id: 'reviewer-fallback',
    created_at: '2026-01-15T10:30:00.000Z',
    updated_at: '2026-02-20T14:45:00.000Z',
  } as unknown as Application;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ApplicationDetailsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ApplicationDetailsComponent);
    component = fixture.componentInstance;

    fixture.componentRef.setInput('application', mockApplication);
    fixture.detectChanges();
  });

  function getTextForLabel(label: string): string {
    const details: HTMLElement[] = Array.from(
      fixture.nativeElement.querySelectorAll('.detail'),
    );

    const detail = details.find(
      (element) =>
        element.querySelector('label')?.textContent?.trim() === label,
    );

    return detail?.querySelector('p')?.textContent?.trim() ?? '';
  }

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render all four information sections', () => {
    const headings = Array.from(
      fixture.nativeElement.querySelectorAll(
        'h2',
      ) as NodeListOf<HTMLHeadingElement>,
    ).map((element) => element.textContent?.trim());

    expect(headings).toEqual([
      'Business Information',
      'Owner Information',
      'Processing Information',
      'Application Metadata',
    ]);
  });

  it('should display business information', () => {
    expect(getTextForLabel('Business Name')).toBe('Acme Trading');
    expect(getTextForLabel('Legal Business Name')).toBe(
      'Acme Trading Private Limited',
    );
    expect(getTextForLabel('Business Type')).toBe('Private Limited');
    expect(getTextForLabel('Application ID')).toBe('app-123');
  });

  it('should display owner information', () => {
    expect(getTextForLabel('Owner Name')).toBe('John Doe');
    expect(getTextForLabel('Email Address')).toBe('john@example.com');
    expect(getTextForLabel('Phone Number')).toBe('+977-9800000000');
  });

  it('should display processing information', () => {
    expect(getTextForLabel('Processing Volume')).toBe('125,000 NPR');
    expect(getTextForLabel('Currency')).toBe('NPR');
  });

  it('should display application metadata', () => {
    expect(getTextForLabel('Created By')).toBe('Jane Smith');
    expect(getTextForLabel('Assigned Reviewer')).toBe('Alex Reviewer');
    expect(getTextForLabel('Created At')).not.toBe('—');
    expect(getTextForLabel('Last Updated')).not.toBe('—');
  });

  it('should format dates as localized date-time strings', () => {
    const value = '2026-01-15T10:30:00.000Z';

    expect(component.formatDate(value)).toBe(new Date(value).toLocaleString());
  });

  it('should return a dash when the date is missing', () => {
    expect(component.formatDate(null)).toBe('—');
    expect(component.formatDate(undefined)).toBe('—');
    expect(component.formatDate('')).toBe('—');
  });

  it('should return a dash for an invalid date', () => {
    expect(component.formatDate('not-a-date')).toBe('—');
  });

  it('should format processing volume with the supplied currency', () => {
    expect(component.formatVolume(1234567, 'USD')).toBe(
      `${new Intl.NumberFormat().format(1234567)} USD`,
    );
  });

  it('should format processing volume without a currency', () => {
    expect(component.formatVolume(5000, null)).toBe(
      new Intl.NumberFormat().format(5000),
    );
    expect(component.formatVolume(5000, undefined)).toBe(
      new Intl.NumberFormat().format(5000),
    );
  });

  it('should return a dash when processing volume is missing', () => {
    expect(component.formatVolume(null, 'USD')).toBe('—');
    expect(component.formatVolume(undefined, 'USD')).toBe('—');
  });

  it('should preserve zero as a valid processing volume', () => {
    expect(component.formatVolume(0, 'NPR')).toBe('0 NPR');
  });

  it('should format underscore-separated business types', () => {
    expect(component.formatValue('SOLE_PROPRIETORSHIP')).toBe(
      'Sole Proprietorship',
    );
    expect(component.formatValue('PRIVATE_LIMITED')).toBe('Private Limited');
  });

  it('should return a dash when the business type is missing', () => {
    expect(component.formatValue(null)).toBe('—');
    expect(component.formatValue(undefined)).toBe('—');
    expect(component.formatValue('')).toBe('—');
  });

  it('should use a dash for missing business and owner information', () => {
    fixture.componentRef.setInput('application', {
      ...mockApplication,
      business_name: null,
      legal_business_name: '',
      business_type: null,
      owner_name: '',
      owner_email: null,
      owner_phone: undefined,
      processing_currency: null,
    } as unknown as Application);

    fixture.detectChanges();

    expect(getTextForLabel('Business Name')).toBe('—');
    expect(getTextForLabel('Legal Business Name')).toBe('—');
    expect(getTextForLabel('Business Type')).toBe('—');
    expect(getTextForLabel('Owner Name')).toBe('—');
    expect(getTextForLabel('Email Address')).toBe('—');
    expect(getTextForLabel('Phone Number')).toBe('—');
    expect(getTextForLabel('Currency')).toBe('—');
  });

  it('should fall back to the creator ID when the creator name is missing', () => {
    fixture.componentRef.setInput('application', {
      ...mockApplication,
      created_by_name: null,
      created_by_id: 'user-fallback',
    } as unknown as Application);

    fixture.detectChanges();

    expect(getTextForLabel('Created By')).toBe('user-fallback');
  });

  it('should fall back to the reviewer ID when the reviewer name is missing', () => {
    fixture.componentRef.setInput('application', {
      ...mockApplication,
      assigned_reviewer_name: null,
      assigned_reviewer_id: 'assigned-reviewer-fallback',
    } as unknown as Application);

    fixture.detectChanges();

    expect(getTextForLabel('Assigned Reviewer')).toBe(
      'assigned-reviewer-fallback',
    );
  });

  it('should fall back to reviewer_id when assigned reviewer fields are missing', () => {
    fixture.componentRef.setInput('application', {
      ...mockApplication,
      assigned_reviewer_name: null,
      assigned_reviewer_id: null,
      reviewer_id: 'reviewer-fallback',
    } as unknown as Application);

    fixture.detectChanges();

    expect(getTextForLabel('Assigned Reviewer')).toBe('reviewer-fallback');
  });

  it('should show dashes when creator and reviewer metadata are missing', () => {
    fixture.componentRef.setInput('application', {
      ...mockApplication,
      created_by_name: null,
      created_by_id: null,
      assigned_reviewer_name: null,
      assigned_reviewer_id: null,
      reviewer_id: null,
      created_at: null,
      updated_at: null,
    } as unknown as Application);

    fixture.detectChanges();

    expect(getTextForLabel('Created By')).toBe('—');
    expect(getTextForLabel('Assigned Reviewer')).toBe('—');
    expect(getTextForLabel('Created At')).toBe('—');
    expect(getTextForLabel('Last Updated')).toBe('—');
  });

  it('should update the rendered details when the application input changes', () => {
    fixture.componentRef.setInput('application', {
      ...mockApplication,
      id: 'app-456',
      business_name: 'Updated Business',
      processing_volume: 2500,
      processing_currency: 'USD',
    } as unknown as Application);

    fixture.detectChanges();

    expect(getTextForLabel('Application ID')).toBe('app-456');
    expect(getTextForLabel('Business Name')).toBe('Updated Business');
    expect(getTextForLabel('Processing Volume')).toBe('2,500 USD');
  });
});
