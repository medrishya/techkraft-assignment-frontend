import 'zone.js';
import 'zone.js/testing';

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError, Subject } from 'rxjs';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

import { LoginComponent } from './login.component';
import { AuthService } from '../../core/auth.service';

describe('LoginComponent', () => {
  let fixture: ComponentFixture<LoginComponent>;
  let component: LoginComponent;
  let authService: {
    login: ReturnType<typeof vi.fn>;
  };
  let router: {
    navigateByUrl: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    authService = {
      login: vi.fn(() => of({ access_token: 'test-token' })),
    };

    router = {
      navigateByUrl: vi.fn(() => Promise.resolve(true)),
    };

    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        {
          provide: AuthService,
          useValue: authService,
        },
        {
          provide: Router,
          useValue: router,
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
  });

  function setCredentials(email: string, password: string): void {
    component.form.controls.email.setValue(email);
    component.form.controls.password.setValue(password);
    fixture.detectChanges();
  }

  function submitForm(): void {
    const form: HTMLFormElement = fixture.nativeElement.querySelector('form');

    form.dispatchEvent(
      new Event('submit', { bubbles: true, cancelable: true }),
    );

    fixture.detectChanges();
  }

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with empty credentials and default state', () => {
    expect(component.form.getRawValue()).toEqual({
      email: '',
      password: '',
    });
    expect(component.loading()).toBe(false);
    expect(component.errorMessage()).toBe('');
  });

  it('should render the sign-in form', () => {
    const element: HTMLElement = fixture.nativeElement;

    expect(element.querySelector('h1')?.textContent).toContain('Sign in');
    expect(element.querySelector('#email')).toBeTruthy();
    expect(element.querySelector('#password')).toBeTruthy();
    expect(element.querySelector('button')?.textContent).toContain('Sign in');
  });

  it('should mark the form invalid when credentials are empty', () => {
    expect(component.form.invalid).toBe(true);
    expect(authService.login).not.toHaveBeenCalled();
  });

  it('should reject an invalid email address', () => {
    setCredentials('not-an-email', 'password123');

    expect(component.form.controls.email.invalid).toBe(true);
    expect(component.form.invalid).toBe(true);
  });

  it('should reject a password shorter than eight characters', () => {
    setCredentials('user@example.com', 'short');

    expect(component.form.controls.password.invalid).toBe(true);
    expect(component.form.invalid).toBe(true);
  });

  it('should accept valid credentials', () => {
    setCredentials('user@example.com', 'password123');

    expect(component.form.valid).toBe(true);
  });

  it('should mark all fields as touched when submitting an invalid form', () => {
    component.submit();

    expect(component.form.controls.email.touched).toBe(true);
    expect(component.form.controls.password.touched).toBe(true);
    expect(authService.login).not.toHaveBeenCalled();
  });

  it('should show email validation feedback after the email is touched', () => {
    component.form.controls.email.markAsTouched();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain(
      'Enter a valid email address.',
    );
  });

  it('should show password validation feedback after the password is touched', () => {
    component.form.controls.password.markAsTouched();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain(
      'Password must contain at least 8 characters.',
    );
  });

  it('should disable the submit button when the form is invalid', () => {
    const button: HTMLButtonElement =
      fixture.nativeElement.querySelector('button');

    expect(button.disabled).toBe(true);
  });

  it('should call AuthService.login with valid credentials', () => {
    setCredentials('user@example.com', 'password123');

    component.submit();

    expect(authService.login).toHaveBeenCalledWith({
      email: 'user@example.com',
      password: 'password123',
    });
  });

  it('should navigate to the dashboard after successful login', () => {
    setCredentials('user@example.com', 'password123');

    component.submit();

    expect(router.navigateByUrl).toHaveBeenCalledWith('/dashboard');
  });

  it('should clear the previous error message before submitting', () => {
    component.errorMessage.set('Previous error');
    setCredentials('user@example.com', 'password123');

    component.submit();

    expect(component.errorMessage()).toBe('');
  });

  it('should display an error when login fails', () => {
    authService.login.mockReturnValue(
      throwError(() => new Error('Invalid credentials')),
    );

    setCredentials('user@example.com', 'password123');
    component.submit();
    fixture.detectChanges();

    expect(component.errorMessage()).toBe(
      'Sign-in failed. Check your credentials or API configuration.',
    );
    expect(fixture.nativeElement.textContent).toContain(
      'Sign-in failed. Check your credentials or API configuration.',
    );
  });

  it('should not navigate when login fails', () => {
    authService.login.mockReturnValue(
      throwError(() => new Error('Invalid credentials')),
    );

    setCredentials('user@example.com', 'password123');
    component.submit();

    expect(router.navigateByUrl).not.toHaveBeenCalled();
  });

  it('should show the loading state while login is pending', () => {
    const loginSubject = new Subject<unknown>();
    authService.login.mockReturnValue(loginSubject.asObservable());

    setCredentials('user@example.com', 'password123');
    component.submit();
    fixture.detectChanges();

    expect(component.loading()).toBe(true);
    expect(fixture.nativeElement.querySelector('button').disabled).toBe(true);
    expect(fixture.nativeElement.textContent).toContain('Signing in…');

    loginSubject.next({ access_token: 'test-token' });
    loginSubject.complete();
    fixture.detectChanges();

    expect(component.loading()).toBe(false);
  });

  it('should clear the loading state after a login error', () => {
    authService.login.mockReturnValue(
      throwError(() => new Error('Network error')),
    );

    setCredentials('user@example.com', 'password123');
    component.submit();

    expect(component.loading()).toBe(false);
  });

  it('should not submit again while login is already in progress', () => {
    const loginSubject = new Subject<unknown>();
    authService.login.mockReturnValue(loginSubject.asObservable());

    setCredentials('user@example.com', 'password123');

    component.submit();
    component.submit();

    expect(authService.login).toHaveBeenCalledTimes(1);

    loginSubject.complete();
  });

  it('should not call login when the form is invalid', () => {
    setCredentials('invalid-email', 'short');

    component.submit();

    expect(authService.login).not.toHaveBeenCalled();
  });

  it('should handle submission through the form submit event', () => {
    setCredentials('user@example.com', 'password123');

    submitForm();

    expect(authService.login).toHaveBeenCalledWith({
      email: 'user@example.com',
      password: 'password123',
    });
  });
});
