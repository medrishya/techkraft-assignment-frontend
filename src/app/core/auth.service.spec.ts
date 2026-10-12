import 'zone.js';
import 'zone.js/testing';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';

import { AuthService } from './auth.service';
import { AuthTokens, LoginPayload } from './auth.models';
import { Role } from '../features/applications/models/application.model';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  const storage = new Map<string, string>();

  const tokens: AuthTokens = {
    accessToken: 'test-access-token',
    refreshToken: 'test-refresh-token',
  };

  beforeEach(() => {
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      value: {
        getItem: (key: string) => storage.get(key) ?? null,
        setItem: (key: string, value: string) =>
          storage.set(key, String(value)),
        removeItem: (key: string) => storage.delete(key),
        clear: () => storage.clear(),
      },
    });

    storage.clear();

    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock?.verify();
    storage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should initially be unauthenticated', () => {
    expect(service.isAuthenticated()).toBe(false);
    expect(service.accessToken()).toBeNull();
  });

  it('should store tokens and authenticate the user', () => {
    service.setTokens(tokens);

    expect(service.accessToken()).toBe(tokens.accessToken);
    expect(service.isAuthenticated()).toBe(true);
    expect(localStorage.getItem('starter.accessToken')).toBe(
      tokens.accessToken,
    );
    expect(localStorage.getItem('starter.refreshToken')).toBe(
      tokens.refreshToken,
    );
  });

  it('should clear tokens', () => {
    service.setTokens(tokens);

    service.clearTokens();

    expect(service.accessToken()).toBeNull();
    expect(service.isAuthenticated()).toBe(false);
    expect(localStorage.getItem('starter.accessToken')).toBeNull();
    expect(localStorage.getItem('starter.refreshToken')).toBeNull();
  });

  it('should clear tokens on logout', () => {
    service.setTokens(tokens);

    service.logout();

    expect(service.isAuthenticated()).toBe(false);
  });

  it('should login and save returned tokens', () => {
    const payload = {
      email: 'test@example.com',
      password: 'password123',
    } as LoginPayload;

    service.login(payload).subscribe((result) => {
      expect(result).toEqual(tokens);
      expect(service.accessToken()).toBe(tokens.accessToken);
      expect(service.isAuthenticated()).toBe(true);
    });

    const request = httpMock.expectOne((req) =>
      req.url.endsWith('/auth/login'),
    );

    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(payload);

    request.flush(tokens);
  });

  it('should refresh tokens using the stored refresh token', () => {
    localStorage.setItem('starter.refreshToken', 'old-refresh-token');

    service.refresh().subscribe((result) => {
      expect(result).toEqual(tokens);
      expect(service.accessToken()).toBe(tokens.accessToken);
    });

    const request = httpMock.expectOne((req) =>
      req.url.endsWith('/auth/refresh'),
    );

    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      refreshToken: 'old-refresh-token',
    });

    request.flush(tokens);
  });

  it('should throw if no refresh token exists', () => {
    expect(() => service.refresh()).toThrowError(
      'No refresh token is available',
    );
  });

  it('should fetch the current user', () => {
    const user = {
      id: 'user-1',
      email: 'test@example.com',
      role: 'ADMIN',
    } as any;

    service.getCurrentUser().subscribe((result) => {
      expect(result).toEqual(user);
    });

    const request = httpMock.expectOne('http://localhost:3000/me');

    expect(request.request.method).toBe('GET');

    request.flush(user);
  });

  it('should allow a role included in the allowed roles', () => {
    expect(service.hasRole('ADMIN' as Role, ['ADMIN' as Role])).toBe(true);
  });

  it('should reject a role not included in the allowed roles', () => {
    expect(service.hasRole('SALES' as Role, ['ADMIN' as Role])).toBe(false);
  });

  it('should reject a null role', () => {
    expect(service.hasRole(null, ['ADMIN' as Role])).toBe(false);
  });
});
