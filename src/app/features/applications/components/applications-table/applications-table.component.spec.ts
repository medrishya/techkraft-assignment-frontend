import 'zone.js';
import 'zone.js/testing';

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { ApplicationsTableComponent } from './applications-table.component';
import { Application, Role } from '../../models/application.model';

describe('ApplicationsTableComponent', () => {
  let fixture: ComponentFixture<ApplicationsTableComponent>;
  let component: ApplicationsTableComponent;

  const mockApplication = {
    id: 'app-1',
    business_name: 'Acme Trading',
    legal_business_name: 'Acme Trading Pvt. Ltd.',
    business_type: 'LIMITED_COMPANY',
    owner_name: 'John Doe',
    owner_email: 'john.doe@example.com',
    owner_phone: '+9779812345678',
    processing_currency: 'USD',
    processing_volume: 50000,
    application_status: 'SUBMITTED',
    risk_status: 'PENDING',
    created_by_name: 'Sales User',
    assigned_reviewer_name: 'Reviewer User',
    created_at: '2026-01-15T10:00:00.000Z',
    updated_at: '2026-01-16T10:00:00.000Z',
  } as unknown as Application;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ApplicationsTableComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(ApplicationsTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  function setRole(role: Role | null): void {
    fixture.componentRef.setInput('role', role);
    fixture.detectChanges();
  }

  function setApplications(applications: Application[]): void {
    fixture.componentRef.setInput('applications', applications);
    fixture.detectChanges();
  }

  function getText(): string {
    return (fixture.nativeElement as HTMLElement).textContent ?? '';
  }

  function getButtonByLabel(label: string): HTMLButtonElement | null {
    return fixture.nativeElement.querySelector(
      `button[aria-label="${label}"]`,
    ) as HTMLButtonElement | null;
  }

  function getLinkByLabel(label: string): HTMLAnchorElement | null {
    return fixture.nativeElement.querySelector(
      `a[aria-label="${label}"]`,
    ) as HTMLAnchorElement | null;
  }

  function getHeaders(): string[] {
    const headers = Array.from(
      fixture.nativeElement.querySelectorAll('thead th'),
    ) as HTMLTableCellElement[];

    return headers.map((element) => element.textContent?.trim() ?? '');
  }

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display the table heading and total record count', () => {
    fixture.componentRef.setInput('total', 12);
    fixture.detectChanges();

    expect(getText()).toContain('Applications');
    expect(getText()).toContain('12 total records');
  });

  it('should display the empty state when there are no applications', () => {
    expect(getText()).toContain('No applications found.');
  });

  it('should display the loading state', () => {
    fixture.componentRef.setInput('loading', true);
    fixture.detectChanges();

    expect(getText()).toContain('Loading applications...');
    expect(
      fixture.nativeElement.querySelector('[role="status"]'),
    ).not.toBeNull();
  });

  it('should show the empty state instead of application rows when not loading', () => {
    fixture.componentRef.setInput('loading', false);
    setApplications([]);

    expect(getText()).toContain('No applications found.');
    expect(fixture.nativeElement.querySelector('tbody tr')).not.toBeNull();
  });

  it('should render application details', () => {
    setRole('ADMIN');
    setApplications([mockApplication]);

    const text = getText();

    expect(text).toContain('Acme Trading');
    expect(text).toContain('Acme Trading Pvt. Ltd.');
    expect(text).toContain('John Doe');
    expect(text).toContain('USD');
    expect(text).toContain('50000');
    expect(text).toContain('Sales User');
    expect(text).toContain('Reviewer User');
  });

  it('should mask owner contact details initially', () => {
    setRole('ADMIN');
    setApplications([mockApplication]);

    const text = getText();

    expect(text).not.toContain('john.doe@example.com');
    expect(text).not.toContain('+9779812345678');
    expect(getButtonByLabel('Reveal contact details')).not.toBeNull();
  });

  it('should show a Reveal button for ADMIN, SALES, and REVIEWER', () => {
    const roles: Role[] = ['ADMIN', 'SALES', 'REVIEWER'];

    for (const role of roles) {
      setRole(role);
      setApplications([mockApplication]);

      expect(getButtonByLabel('Reveal contact details')).not.toBeNull();
    }
  });

  it('should not show a Reveal button when the role is null', () => {
    setRole(null);
    setApplications([mockApplication]);

    expect(getButtonByLabel('Reveal contact details')).toBeNull();
  });

  it('should emit contactRevealToggled when Reveal is clicked', () => {
    setRole('ADMIN');
    setApplications([mockApplication]);

    let emittedId: string | undefined;
    component.contactRevealToggled.subscribe((id) => {
      emittedId = id;
    });

    getButtonByLabel('Reveal contact details')?.click();

    expect(emittedId).toBe('app-1');
  });

  it('should display contact details when the application ID is revealed', () => {
    setRole('ADMIN');
    setApplications([mockApplication]);
    fixture.componentRef.setInput('revealedContactIds', new Set(['app-1']));
    fixture.detectChanges();

    expect(getText()).toContain('john.doe@example.com');
    expect(getText()).toContain('+9779812345678');
    expect(getButtonByLabel('Hide contact details')).not.toBeNull();
  });

  it('should show role-specific columns for ADMIN', () => {
    setRole('ADMIN');

    const headers = getHeaders();

    expect(headers).toContain('Created by');
    expect(headers).toContain('Reviewer');
    expect(component.columnCount()).toBe(10);
  });

  it('should show the Created by column for REVIEWER but not Reviewer', () => {
    setRole('REVIEWER');

    const headers = getHeaders();

    expect(headers).toContain('Created by');
    expect(headers).not.toContain('Reviewer');
    expect(component.columnCount()).toBe(9);
  });

  it('should show the Reviewer column for SALES but not Created by', () => {
    setRole('SALES');

    const headers = getHeaders();

    expect(headers).toContain('Reviewer');
    expect(headers).not.toContain('Created by');
    expect(component.columnCount()).toBe(9);
  });

  it('should show neither role-specific column when role is null', () => {
    setRole(null);

    const headers = getHeaders();

    expect(headers).not.toContain('Created by');
    expect(headers).not.toContain('Reviewer');
    expect(component.columnCount()).toBe(8);
  });

  it('should display Unassigned when creator or reviewer is missing', () => {
    const application = {
      ...mockApplication,
      created_by_name: null,
      assigned_reviewer_name: null,
    } as unknown as Application;

    setRole('ADMIN');
    setApplications([application]);

    expect(getText()).toContain('Unassigned');
  });

  it('should show Review action for ADMIN and REVIEWER', () => {
    for (const role of ['ADMIN', 'REVIEWER'] as Role[]) {
      setRole(role);
      setApplications([mockApplication]);

      const link = getLinkByLabel('Review Acme Trading');

      expect(link).not.toBeNull();
      expect(link?.getAttribute('href')).toBe('/reviewer/app-1');
    }
  });

  it('should not show Review action for SALES', () => {
    setRole('SALES');
    setApplications([mockApplication]);

    expect(getLinkByLabel('Review Acme Trading')).toBeNull();
  });

  it('should show Edit action for ADMIN and SALES', () => {
    for (const role of ['ADMIN', 'SALES'] as Role[]) {
      setRole(role);
      setApplications([mockApplication]);

      const link = getLinkByLabel('Edit Acme Trading');

      expect(link).not.toBeNull();
      expect(link?.getAttribute('href')).toBe('/editor/app-1');
    }
  });

  it('should not show Edit action for REVIEWER', () => {
    setRole('REVIEWER');
    setApplications([mockApplication]);

    expect(getLinkByLabel('Edit Acme Trading')).toBeNull();
  });

  it('should show Delete action for ADMIN and SALES', () => {
    for (const role of ['ADMIN', 'SALES'] as Role[]) {
      setRole(role);
      setApplications([mockApplication]);

      expect(getButtonByLabel('Delete Acme Trading')).not.toBeNull();
    }
  });

  it('should not show Delete action for REVIEWER', () => {
    setRole('REVIEWER');
    setApplications([mockApplication]);

    expect(getButtonByLabel('Delete Acme Trading')).toBeNull();
  });

  it('should emit the selected application when Delete is clicked', () => {
    setRole('ADMIN');
    setApplications([mockApplication]);

    let emittedApplication: Application | undefined;
    component.deleteRequested.subscribe((application) => {
      emittedApplication = application;
    });

    getButtonByLabel('Delete Acme Trading')?.click();

    expect(emittedApplication).toBe(mockApplication);
  });

  it('should disable Delete while an application is being deleted', () => {
    fixture.componentRef.setInput('role', 'ADMIN');
    fixture.componentRef.setInput('applications', [mockApplication]);
    fixture.componentRef.setInput('deletingId', 'app-1');
    fixture.detectChanges();

    const deleteButton = fixture.nativeElement.querySelector(
      'button[aria-label="Delete Acme Trading"]',
    ) as HTMLButtonElement | null;

    expect(deleteButton).not.toBeNull();
    expect(deleteButton?.disabled).toBe(true);
  });

  it('should disable Delete while an application is being deleted', () => {
    setRole('ADMIN');
    setApplications([mockApplication]);
    fixture.componentRef.setInput('deletingId', 'app-1');
    fixture.detectChanges();

    expect(getButtonByLabel('Delete Acme Trading')?.disabled).toBe(true);
  });

  it('should mark Edit as disabled while an application is being deleted', () => {
    fixture.componentRef.setInput('role', 'ADMIN');
    fixture.componentRef.setInput('applications', [mockApplication]);
    fixture.componentRef.setInput('deletingId', 'app-1');
    fixture.detectChanges();

    const editLink = fixture.nativeElement.querySelector(
      'a[aria-label="Edit Acme Trading"]',
    ) as HTMLAnchorElement | null;

    expect(editLink).not.toBeNull();
    expect(editLink?.getAttribute('aria-disabled')).toBe('true');
    expect(editLink?.classList.contains('disabled')).toBe(true);
  });

  it('should mark Edit as disabled while deleting an application', () => {
    setRole('SALES');
    setApplications([mockApplication]);
    fixture.componentRef.setInput('deletingId', 'app-1');
    fixture.detectChanges();

    const link = getLinkByLabel('Edit Acme Trading');

    expect(link?.getAttribute('aria-disabled')).toBe('true');
    expect(link?.classList.contains('disabled')).toBe(true);
  });

  it('should apply the approved risk status class', () => {
    setApplications([
      {
        ...mockApplication,
        risk_status: 'APPROVED',
      } as unknown as Application,
    ]);

    expect(
      fixture.nativeElement.querySelector('.status-approved'),
    ).not.toBeNull();
  });

  it('should apply the warning class for NEEDS_INFO', () => {
    setApplications([
      {
        ...mockApplication,
        risk_status: 'NEEDS_INFO',
      } as unknown as Application,
    ]);

    expect(
      fixture.nativeElement.querySelector('.status-warning'),
    ).not.toBeNull();
  });

  it('should apply the warning class for PENDING', () => {
    setApplications([
      {
        ...mockApplication,
        risk_status: 'PENDING',
      } as unknown as Application,
    ]);

    expect(
      fixture.nativeElement.querySelector('.status-warning'),
    ).not.toBeNull();
  });

  it('should apply the rejected class for REJECTED', () => {
    setApplications([
      {
        ...mockApplication,
        risk_status: 'REJECTED',
      } as unknown as Application,
    ]);

    expect(
      fixture.nativeElement.querySelector('.status-rejected'),
    ).not.toBeNull();
  });

  it('should apply the neutral class for an unknown risk status', () => {
    setApplications([
      {
        ...mockApplication,
        risk_status: 'UNKNOWN_STATUS',
      } as unknown as Application,
    ]);

    expect(
      fixture.nativeElement.querySelector('.status-neutral'),
    ).not.toBeNull();
  });

  it('should render one row per application', () => {
    setApplications([
      mockApplication,
      {
        ...mockApplication,
        id: 'app-2',
        business_name: 'Beta Ltd',
      } as Application,
    ]);

    expect(fixture.nativeElement.querySelectorAll('tbody tr').length).toBe(2);
    expect(getText()).toContain('Beta Ltd');
  });

  it('should expose the table headers with column scope', () => {
    setApplications([mockApplication]);

    const headers = Array.from(
      fixture.nativeElement.querySelectorAll('thead th'),
    ) as HTMLTableCellElement[];

    expect(headers.length).toBeGreaterThan(0);
    expect(headers.every((header) => header.scope === 'col')).toBe(true);
  });
});
