import {
  Component,
  computed,
  inject,
  OnDestroy,
  OnInit,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { AuthService } from '../../../core/auth.service';
import { ApplicationService } from '../../../core/services/application.service';

import { Application, Role } from '../models/application.model';

import { ApplicationFiltersComponent } from '../components/application-filters/application-filters.component';
import { ApplicationsTableComponent } from '../components/applications-table/applications-table.component';
import { ApplicationsPaginationComponent } from '../components/applications-pagination/applications-pagination.component';
import { DeleteConfirmationComponent } from '../components/delete-confirmation/delete-confirmation.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    RouterLink,
    ApplicationFiltersComponent,
    ApplicationsTableComponent,
    ApplicationsPaginationComponent,
    DeleteConfirmationComponent,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent implements OnInit, OnDestroy {
  private readonly authService = inject(AuthService);
  private readonly applicationService = inject(ApplicationService);

  readonly role = signal<Role | null>(null);
  readonly loadingUser = signal(true);
  readonly loading = signal(false);
  readonly error = signal('');
  readonly successMessage = signal('');

  readonly applications = signal<Application[]>([]);
  readonly total = signal(0);
  readonly page = signal(1);
  readonly limit = signal(10);

  readonly deletingId = signal<string | null>(null);
  readonly deleteConfirmationOpen = signal(false);
  readonly selectedApplication = signal<Application | null>(null);
  readonly revealedContactIds = signal<Set<string>>(new Set());

  searchInput = '';
  statusFilter = '';
  riskFilter = '';

  readonly canOpenEditor = computed(() => this.role() === 'SALES');

  readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.total() / this.limit())),
  );

  private successMessageTimeout?: ReturnType<typeof setTimeout>;

  ngOnInit(): void {
    this.loadCurrentUser();
  }

  ngOnDestroy(): void {
    this.dismissSuccessMessage();
  }

  private loadCurrentUser(): void {
    this.loadingUser.set(true);
    this.error.set('');

    this.authService
      .getCurrentUser()
      .pipe(finalize(() => this.loadingUser.set(false)))
      .subscribe({
        next: (user: any) => {
          this.role.set(user.role);
          this.loadApplications();
        },
        error: (error: unknown) => {
          this.error.set(
            'Unable to load your user profile. Please sign in again.',
          );
        },
      });
  }

  loadApplications(): void {
    if (!this.role() || this.loading()) return;

    this.loading.set(true);
    this.error.set('');

    this.applicationService
      .getApplications({
        page: this.page(),
        limit: this.limit(),
        search: this.searchInput.trim(),
        application_status: this.statusFilter,
        risk_status: this.riskFilter,
      })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (response) => {
          this.applications.set(response.data);
          this.total.set(response.total);
          this.page.set(response.page);
          this.limit.set(response.limit);
        },
        error: (err) => {
          this.error.set(
            err.status === 401
              ? 'Your session has expired. Please sign in again.'
              : err.status === 403
                ? 'You do not have permission to view these applications.'
                : 'Unable to load applications. Check your connection and try again.',
          );
        },
      });
  }

  applyFilters(): void {
    this.page.set(1);
    this.loadApplications();
  }

  clearFilters(): void {
    this.searchInput = '';
    this.statusFilter = '';
    this.riskFilter = '';
    this.page.set(1);
    this.loadApplications();
  }

  changePage(nextPage: number): void {
    if (nextPage < 1 || nextPage > this.totalPages()) return;

    this.page.set(nextPage);
    this.loadApplications();
  }

  changePageSize(size: number): void {
    this.limit.set(size);
    this.page.set(1);
    this.loadApplications();
  }

  toggleContact(id: string): void {
    const updated = new Set(this.revealedContactIds());

    if (updated.has(id)) {
      updated.delete(id);
    } else {
      updated.add(id);
    }

    this.revealedContactIds.set(updated);
  }

  openDeleteConfirmation(app: Application): void {
    if (this.loading() || this.deletingId() !== null) return;
    if (this.role() !== 'ADMIN' && this.role() !== 'SALES') return;

    this.selectedApplication.set(app);
    this.deleteConfirmationOpen.set(true);
  }

  cancelDelete(): void {
    if (this.deletingId() !== null) return;

    this.deleteConfirmationOpen.set(false);
    this.selectedApplication.set(null);
  }

  confirmDelete(): void {
    const app = this.selectedApplication();

    if (!app || this.loading() || this.deletingId() !== null) return;
    if (this.role() !== 'ADMIN' && this.role() !== 'SALES') return;

    this.deletingId.set(app.id);
    this.error.set('');
    this.dismissSuccessMessage();

    this.applicationService
      .deleteApplication(app.id)
      .pipe(finalize(() => this.deletingId.set(null)))
      .subscribe({
        next: () => {
          this.deleteConfirmationOpen.set(false);
          this.selectedApplication.set(null);

          this.showSuccessMessage(
            `"${app.business_name}" was deleted successfully.`,
          );

          if (this.applications().length === 1 && this.page() > 1) {
            this.page.update((current) => current - 1);
          }

          this.loadApplications();
        },
        error: (err) => {
          this.deleteConfirmationOpen.set(false);
          this.selectedApplication.set(null);

          this.error.set(
            err.status === 401
              ? 'Your session has expired. Please sign in again.'
              : err.status === 403
                ? 'You do not have permission to delete this application.'
                : err.status === 404
                  ? 'Application not found or you do not have permission to delete it.'
                  : 'Unable to delete application. Please try again.',
          );
        },
      });
  }

  dismissSuccessMessage(): void {
    if (this.successMessageTimeout) {
      clearTimeout(this.successMessageTimeout);
      this.successMessageTimeout = undefined;
    }

    this.successMessage.set('');
  }

  private showSuccessMessage(message: string): void {
    this.dismissSuccessMessage();
    this.successMessage.set(message);

    this.successMessageTimeout = setTimeout(() => {
      this.successMessage.set('');
      this.successMessageTimeout = undefined;
    }, 4000);
  }
}
