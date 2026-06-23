import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const token = auth.accessToken;

  const authReq = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // ASP.NET Identity redirects 401 → /Account/Login (302 → 404).
      // Treat any response landing on /Account/Login as a session expiry.
      const isLoginRedirect = error.url?.includes('/Account/Login') ?? false;

      if (error.status === 401 || isLoginRedirect) {
        if (auth.refreshToken && !isLoginRedirect) {
          return auth.refreshTokenRequest().pipe(
            switchMap(() => {
              const newToken = auth.accessToken;
              const retryReq = newToken
                ? req.clone({ setHeaders: { Authorization: `Bearer ${newToken}` } })
                : req;
              return next(retryReq);
            }),
            catchError(refreshError => {
              auth.logout();
              return throwError(() => refreshError);
            })
          );
        }
        // No refresh token or redirect case — session expired, redirect to login
        auth.logout();
        return throwError(() => error);
      }

      return throwError(() => error);
    })
  );
};
