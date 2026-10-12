import 'zone.js';
import 'zone.js/testing';

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { provideRouter } from '@angular/router';
import { DashboardComponent } from './dashboard.component';
import { AuthService } from '../../../core/auth.service';
import { ApplicationService } from '../../../core/services/application.service';
import { Application, Role } from '../models/application.model';

describe('DashboardComponent', () => {
  let fixture: ComponentFixture<DashboardComponent>;
  let component: DashboardComponent;

  let authService: {
    getCurrentUser: ReturnType<typeof vi.fn>;
  };

  let applicationService: {
    getApplications: ReturnType<typeof vi.fn>;
    deleteApplication: ReturnType<typeof vi.fn>;
  };

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

  const mockResponse = {
    data: [mockApplication],
    total: 1,
    page: 1,
    limit: 10,
  };

  function createComponent(): void {
    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  beforeEach(async () => {
    authService = {
      getCurrentUser: vi.fn(() => of({ role: 'ADMIN' as Role })),
    };

    applicationService = {
      getApplications: vi.fn(() => of(mockResponse)),
      deleteApplication: vi.fn(() => of({})),
    };

    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [
        provideRouter([]),

        {
          provide: AuthService,
          useValue: authService,
        },
        {
          provide: ApplicationService,
          useValue: applicationService,
        },
      ],
    }).compileComponents();

    createComponent();

    // Ignore the API calls made during initial component setup.
    vi.clearAllMocks();
  });

  afterEach(() => {
    fixture.destroy();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with the expected default state', () => {
    expect(component.role()).toBe('ADMIN');
    expect(component.loadingUser()).toBe(false);
    expect(component.loading()).toBe(false);
    expect(component.error()).toBe('');
    expect(component.successMessage()).toBe('');
    expect(component.applications()).toEqual([mockApplication]);
    expect(component.total()).toBe(1);
    expect(component.page()).toBe(1);
    expect(component.limit()).toBe(10);
  });

  it('should calculate total pages correctly', () => {
    component.total.set(25);
    component.limit.set(10);

    expect(component.totalPages()).toBe(3);
  });

  it('should return at least one total page when there are no records', () => {
    component.total.set(0);
    component.limit.set(10);

    expect(component.totalPages()).toBe(1);
  });

  it('should allow opening the editor only for SALES', () => {
    component.role.set('SALES');
    expect(component.canOpenEditor()).toBe(true);

    component.role.set('ADMIN');
    expect(component.canOpenEditor()).toBe(false);

    component.role.set('REVIEWER');
    expect(component.canOpenEditor()).toBe(false);

    component.role.set(null);
    expect(component.canOpenEditor()).toBe(false);
  });

  it('should load applications using the current filters and pagination', () => {
    component.role.set('ADMIN');
    component.page.set(2);
    component.limit.set(25);
    component.searchInput = '  Acme  ';
    component.statusFilter = 'SUBMITTED';
    component.riskFilter = 'PENDING';

    component.loadApplications();

    expect(applicationService.getApplications).toHaveBeenCalledWith({
      page: 2,
      limit: 25,
      search: 'Acme',
      application_status: 'SUBMITTED',
      risk_status: 'PENDING',
    });

    expect(component.loading()).toBe(false);
  });

  it('should update applications and pagination from the API response', () => {
    const response = {
      data: [mockApplication],
      total: 45,
      page: 2,
      limit: 25,
    };

    applicationService.getApplications.mockReturnValue(of(response));

    component.loadApplications();

    expect(component.applications()).toEqual([mockApplication]);
    expect(component.total()).toBe(45);
    expect(component.page()).toBe(2);
    expect(component.limit()).toBe(25);
    expect(component.loading()).toBe(false);
  });

  it('should not load applications when the role is null', () => {
    component.role.set(null);

    component.loadApplications();

    expect(applicationService.getApplications).not.toHaveBeenCalled();
  });

  it('should not start another request while already loading', () => {
    component.loading.set(true);

    component.loadApplications();

    expect(applicationService.getApplications).not.toHaveBeenCalled();
  });

  it('should clear the existing error when loading applications', () => {
    component.error.set('Previous error');

    component.loadApplications();

    expect(component.error()).toBe('');
  });

  it('should set the session-expired message for a 401 response', () => {
    applicationService.getApplications.mockReturnValue(
      throwError(() => ({ status: 401 })),
    );

    component.loadApplications();

    expect(component.error()).toBe(
      'Your session has expired. Please sign in again.',
    );
    expect(component.loading()).toBe(false);
  });

  it('should set the permission error for a 403 response', () => {
    applicationService.getApplications.mockReturnValue(
      throwError(() => ({ status: 403 })),
    );

    component.loadApplications();

    expect(component.error()).toBe(
      'You do not have permission to view these applications.',
    );
  });

  it('should set a generic error for other application loading failures', () => {
    applicationService.getApplications.mockReturnValue(
      throwError(() => ({ status: 500 })),
    );

    component.loadApplications();

    expect(component.error()).toBe(
      'Unable to load applications. Check your connection and try again.',
    );
  });

  it('should reset the page and load applications when applying filters', () => {
    component.page.set(3);

    component.applyFilters();

    expect(component.page()).toBe(1);
    expect(applicationService.getApplications).toHaveBeenCalled();
  });

  it('should clear all filters and reset the page', () => {
    component.searchInput = 'Acme';
    component.statusFilter = 'SUBMITTED';
    component.riskFilter = 'PENDING';
    component.page.set(3);

    component.clearFilters();

    expect(component.searchInput).toBe('');
    expect(component.statusFilter).toBe('');
    expect(component.riskFilter).toBe('');
    expect(component.page()).toBe(1);
    expect(applicationService.getApplications).toHaveBeenCalled();
  });

  it('should change to a valid page', () => {
    component.total.set(30);
    component.limit.set(10);
    component.page.set(1);

    applicationService.getApplications.mockReturnValue(
      of({
        data: [mockApplication],
        total: 30,
        page: 2,
        limit: 10,
      }),
    );

    component.changePage(2);

    expect(component.page()).toBe(2);
    expect(applicationService.getApplications).toHaveBeenCalledWith(
      expect.objectContaining({
        page: 2,
        limit: 10,
      }),
    );
  });

  it('should ignore a page number below one', () => {
    component.page.set(1);

    component.changePage(0);

    expect(component.page()).toBe(1);
    expect(applicationService.getApplications).not.toHaveBeenCalled();
  });

  it('should ignore a page number greater than total pages', () => {
    component.total.set(20);
    component.limit.set(10);
    component.page.set(1);

    component.changePage(3);

    expect(component.page()).toBe(1);
    expect(applicationService.getApplications).not.toHaveBeenCalled();
  });

  it('should change page size and reset the page to one', () => {
    component.page.set(3);
    component.limit.set(10);

    applicationService.getApplications.mockReturnValue(
      of({
        data: [mockApplication],
        total: 30,
        page: 1,
        limit: 25,
      }),
    );

    component.changePageSize(25);

    expect(component.page()).toBe(1);
    expect(component.limit()).toBe(25);
    expect(applicationService.getApplications).toHaveBeenCalledWith(
      expect.objectContaining({
        page: 1,
        limit: 25,
      }),
    );
  });

  it('should reveal a contact when its ID is toggled', () => {
    component.toggleContact('app-1');

    expect(component.revealedContactIds().has('app-1')).toBe(true);
  });

  it('should hide a contact when its revealed ID is toggled again', () => {
    component.revealedContactIds.set(new Set(['app-1']));

    component.toggleContact('app-1');

    expect(component.revealedContactIds().has('app-1')).toBe(false);
  });

  it('should preserve other revealed contact IDs when toggling one', () => {
    component.revealedContactIds.set(new Set(['app-1', 'app-2']));

    component.toggleContact('app-1');

    expect(component.revealedContactIds().has('app-1')).toBe(false);
    expect(component.revealedContactIds().has('app-2')).toBe(true);
  });

  it('should open delete confirmation for ADMIN', () => {
    component.role.set('ADMIN');

    component.openDeleteConfirmation(mockApplication);

    expect(component.selectedApplication()).toBe(mockApplication);
    expect(component.deleteConfirmationOpen()).toBe(true);
  });

  it('should open delete confirmation for SALES', () => {
    component.role.set('SALES');

    component.openDeleteConfirmation(mockApplication);

    expect(component.selectedApplication()).toBe(mockApplication);
    expect(component.deleteConfirmationOpen()).toBe(true);
  });

  it('should not open delete confirmation for REVIEWER', () => {
    component.role.set('REVIEWER');

    component.openDeleteConfirmation(mockApplication);

    expect(component.selectedApplication()).toBe(null);
    expect(component.deleteConfirmationOpen()).toBe(false);
  });

  it('should not open delete confirmation while loading', () => {
    component.role.set('ADMIN');
    component.loading.set(true);

    component.openDeleteConfirmation(mockApplication);

    expect(component.deleteConfirmationOpen()).toBe(false);
  });

  it('should not open delete confirmation while another deletion is in progress', () => {
    component.role.set('ADMIN');
    component.deletingId.set('another-app');

    component.openDeleteConfirmation(mockApplication);

    expect(component.deleteConfirmationOpen()).toBe(false);
  });

  it('should cancel deletion and clear the selected application', () => {
    component.selectedApplication.set(mockApplication);
    component.deleteConfirmationOpen.set(true);

    component.cancelDelete();

    expect(component.deleteConfirmationOpen()).toBe(false);
    expect(component.selectedApplication()).toBe(null);
  });

  it('should not cancel deletion while a deletion is in progress', () => {
    component.selectedApplication.set(mockApplication);
    component.deleteConfirmationOpen.set(true);
    component.deletingId.set('app-1');

    component.cancelDelete();

    expect(component.deleteConfirmationOpen()).toBe(true);
    expect(component.selectedApplication()).toBe(mockApplication);
  });

  it('should not confirm deletion when no application is selected', () => {
    component.selectedApplication.set(null);

    component.confirmDelete();

    expect(applicationService.deleteApplication).not.toHaveBeenCalled();
  });

  it('should not confirm deletion for REVIEWER', () => {
    component.role.set('REVIEWER');
    component.selectedApplication.set(mockApplication);

    component.confirmDelete();

    expect(applicationService.deleteApplication).not.toHaveBeenCalled();
  });

  it('should delete the selected application successfully', () => {
    component.role.set('ADMIN');
    component.selectedApplication.set(mockApplication);
    component.deleteConfirmationOpen.set(true);

    component.confirmDelete();

    expect(applicationService.deleteApplication).toHaveBeenCalledWith('app-1');
    expect(component.deletingId()).toBe(null);
    expect(component.deleteConfirmationOpen()).toBe(false);
    expect(component.selectedApplication()).toBe(null);
    expect(component.successMessage()).toBe(
      '"Acme Trading" was deleted successfully.',
    );
    expect(applicationService.getApplications).toHaveBeenCalled();
  });

  it('should not start a second deletion while loading', () => {
    component.role.set('ADMIN');
    component.selectedApplication.set(mockApplication);
    component.loading.set(true);

    component.confirmDelete();

    expect(applicationService.deleteApplication).not.toHaveBeenCalled();
  });

  it('should not start a second deletion while another deletion is in progress', () => {
    component.role.set('ADMIN');
    component.selectedApplication.set(mockApplication);
    component.deletingId.set('another-app');

    component.confirmDelete();

    expect(applicationService.deleteApplication).not.toHaveBeenCalled();
  });

  it('should show the session-expired message when deletion returns 401', () => {
    component.role.set('ADMIN');
    component.selectedApplication.set(mockApplication);
    component.deleteConfirmationOpen.set(true);

    applicationService.deleteApplication.mockReturnValue(
      throwError(() => ({ status: 401 })),
    );

    component.confirmDelete();

    expect(component.error()).toBe(
      'Your session has expired. Please sign in again.',
    );
    expect(component.deleteConfirmationOpen()).toBe(false);
    expect(component.selectedApplication()).toBe(null);
    expect(component.deletingId()).toBe(null);
  });

  it('should show the permission message when deletion returns 403', () => {
    component.role.set('ADMIN');
    component.selectedApplication.set(mockApplication);

    applicationService.deleteApplication.mockReturnValue(
      throwError(() => ({ status: 403 })),
    );

    component.confirmDelete();

    expect(component.error()).toBe(
      'You do not have permission to delete this application.',
    );
  });

  it('should show the not-found message when deletion returns 404', () => {
    component.role.set('ADMIN');
    component.selectedApplication.set(mockApplication);

    applicationService.deleteApplication.mockReturnValue(
      throwError(() => ({ status: 404 })),
    );

    component.confirmDelete();

    expect(component.error()).toBe(
      'Application not found or you do not have permission to delete it.',
    );
  });

  it('should show a generic message for other deletion failures', () => {
    component.role.set('SALES');
    component.selectedApplication.set(mockApplication);

    applicationService.deleteApplication.mockReturnValue(
      throwError(() => ({ status: 500 })),
    );

    component.confirmDelete();

    expect(component.error()).toBe(
      'Unable to delete application. Please try again.',
    );
  });

  it('should move back one page when deleting the only record on a later page', () => {
    component.role.set('ADMIN');
    component.page.set(2);
    component.applications.set([mockApplication]);
    component.selectedApplication.set(mockApplication);

    component.confirmDelete();

    expect(component.page()).toBe(1);
  });

  it('should dismiss the success message', () => {
    component.successMessage.set('Deleted successfully.');

    component.dismissSuccessMessage();

    expect(component.successMessage()).toBe('');
  });

  it('should clear the success message on destroy', () => {
    component.successMessage.set('Deleted successfully.');

    component.ngOnDestroy();

    expect(component.successMessage()).toBe('');
  });
});
