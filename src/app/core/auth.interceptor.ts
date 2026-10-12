import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import {
  BehaviorSubject,
  catchError,
  filter,
  finalize,
  switchMap,
  take,
  throwError,
} from 'rxjs';
import { AuthService } from './auth.service';
import { AuthTokens } from './auth.models';

let refreshInProgress = false;
const refreshedToken$ = new BehaviorSubject<string | null>(null);

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const isAuthEndpoint = /\/auth\/(login|refresh|logout)(\?|$)/.test(
    request.url,
  );
  const token = auth.accessToken();
  const outgoing =
    token && !isAuthEndpoint
      ? request.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
      : request;

  return next(outgoing).pipe(
    catchError((error: unknown) => {
      if (
        !(error instanceof HttpErrorResponse) ||
        error.status !== 401 ||
        isAuthEndpoint
      ) {
        return throwError(() => error);
      }

      if (!refreshInProgress) {
        refreshInProgress = true;
        refreshedToken$.next(null);

        return auth.refresh().pipe(
          switchMap((tokens: AuthTokens) => {
            refreshedToken$.next(tokens.accessToken);
            return next(
              request.clone({
                setHeaders: { Authorization: `Bearer ${tokens.accessToken}` },
              }),
            );
          }),
          catchError((refreshError: unknown) => {
            auth.clearTokens();
            void router.navigateByUrl('/login');
            return throwError(() => refreshError);
          }),
          finalize(() => {
            refreshInProgress = false;
          }),
        );
      }

      return refreshedToken$.pipe(
        filter((newToken): newToken is string => newToken !== null),
        take(1),
        switchMap((newToken) =>
          next(
            request.clone({
              setHeaders: { Authorization: `Bearer ${newToken}` },
            }),
          ),
        ),
      );
    }),
  );
};
