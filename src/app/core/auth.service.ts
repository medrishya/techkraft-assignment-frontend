import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthTokens, LoginPayload } from './auth.models';

import {
  CurrentUser,
  Role,
} from '../features/applications/models/application.model';

const ACCESS_TOKEN_KEY = 'starter.accessToken';
const REFRESH_TOKEN_KEY = 'starter.refreshToken';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly accessTokenState = signal<string | null>(
    localStorage.getItem(ACCESS_TOKEN_KEY),
  );
  private readonly apiUrl = 'http://localhost:3000';

  readonly accessToken = this.accessTokenState.asReadonly();
  readonly isAuthenticated = computed(() => !!this.accessTokenState());

  login(payload: LoginPayload): Observable<AuthTokens> {
    return this.http
      .post<AuthTokens>(`${environment.apiBaseUrl}/auth/login`, payload)
      .pipe(tap((tokens) => this.setTokens(tokens)));
  }

  refresh(): Observable<AuthTokens> {
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    if (!refreshToken) {
      throw new Error('No refresh token is available');
    }

    return this.http
      .post<AuthTokens>(`${environment.apiBaseUrl}/auth/refresh`, {
        refreshToken,
      })
      .pipe(tap((tokens) => this.setTokens(tokens)));
  }

  setTokens(tokens: AuthTokens): void {
    localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
    this.accessTokenState.set(tokens.accessToken);
  }

  clearTokens(): void {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    this.accessTokenState.set(null);
  }

  logout(): void {
    this.clearTokens();
  }

  getCurrentUser(): Observable<CurrentUser> {
    return this.http.get<CurrentUser>(`${this.apiUrl}/me`);
  }

  hasRole(role: Role | null, allowedRoles: Role[]): boolean {
    return role !== null && allowedRoles.includes(role);
  }
}
