import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../services/auth.service';

export const permissionGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const snackBar = inject(MatSnackBar);

  const requiredPermission: string = route.data['permission'];

  if (auth.hasPermission(requiredPermission)) return true;

  snackBar.open('Acceso denegado', 'Cerrar', { duration: 3000, panelClass: ['error-snack'] });
  router.navigate(['/dashboard']);
  return false;
};
