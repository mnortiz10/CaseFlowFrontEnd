import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslateService } from '@ngx-translate/core';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const snackBar = inject(MatSnackBar);
  const translate = inject(TranslateService);

  const isAuthEndpoint = req.url.includes('/auth/login') || req.url.includes('/auth/register');

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      const isLoginRedirect = error.url?.includes('/Account/Login') ?? false;
      const skipSnackbar = error.status === 401 || isAuthEndpoint || isLoginRedirect;
      if (!skipSnackbar) {
        const message =
          error.error?.error ||
          error.message ||
          translate.instant('ERRORS.UNEXPECTED');
        snackBar.open(message, translate.instant('COMMON.CLOSE'), {
          duration: 5000,
          panelClass: ['error-snack'],
        });
      }
      return throwError(() => error);
    })
  );
};
