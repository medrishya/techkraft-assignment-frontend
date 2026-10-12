import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { AuthService } from './core/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink],
  template: `
    <div class="app-shell">
      <nav class="navbar navbar-expand bg-white border-bottom">
        <div class="container">
          <a class="navbar-brand fw-semibold" routerLink="/"
            >Techkraft Inc Angular Assignment</a
          >
          <div class="d-flex align-items-center gap-3">
            @if (auth.isAuthenticated()) {
              <a routerLink="/dashboard" class="nav-link">Dashboard</a>
              <button
                class="btn btn-outline-secondary btn-sm"
                (click)="logout()"
              >
                Log out
              </button>
            } @else {
              <a routerLink="/login" class="nav-link">Login</a>
            }
          </div>
        </div>
      </nav>
      <main class="container py-4">
        <router-outlet />
      </main>
    </div>
  `,
})
export class AppComponent {
  readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  logout(): void {
    this.auth.logout();
    void this.router.navigateByUrl('/login');
  }
}
