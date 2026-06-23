import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../services/auth.service';

export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const snackBar = inject(MatSnackBar);

  const requiredRole: string = route.data['role'];

  if (auth.hasRole(requiredRole)) return true;

  snackBar.open('Acceso denegado', 'Cerrar', { duration: 3000, panelClass: ['error-snack'] });
  router.navigate(['/dashboard']);
  return false;
};
