import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../../core/auth.service';

@Component({
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <div class="row justify-content-center">
      <div class="col-12 col-md-7 col-lg-5">
        <div class="card bg-white p-4">
          <h1 class="h3 mb-3">Sign in</h1>
          <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
            <div class="mb-3">
              <label for="email" class="form-label">Email</label>
              <input
                id="email"
                type="email"
                class="form-control"
                formControlName="email"
              />
              @if (form.controls.email.touched && form.controls.email.invalid) {
                <div class="form-text error">Enter a valid email address.</div>
              }
            </div>
            <div class="mb-3">
              <label for="password" class="form-label">Password</label>
              <input
                id="password"
                type="password"
                class="form-control"
                formControlName="password"
              />
              @if (
                form.controls.password.touched && form.controls.password.invalid
              ) {
                <div class="form-text error">
                  Password must contain at least 8 characters.
                </div>
              }
            </div>
            @if (errorMessage()) {
              <div class="alert alert-danger" role="alert">
                {{ errorMessage() }}
              </div>
            }
            <button
              class="btn btn-primary w-100"
              [disabled]="form.invalid || loading()"
            >
              @if (loading()) {
                Signing in…
              } @else {
                Sign in
              }
            </button>
          </form>
        </div>
      </div>
    </div>
  `,
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  readonly loading = signal(false);
  readonly errorMessage = signal('');

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  submit(): void {
    if (this.form.invalid || this.loading()) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading.set(true);
    this.errorMessage.set('');
    this.auth
      .login(this.form.getRawValue())
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: () => void this.router.navigateByUrl('/dashboard'),
        error: () =>
          this.errorMessage.set(
            'Sign-in failed. Check your credentials or API configuration.',
          ),
      });
  }
}
