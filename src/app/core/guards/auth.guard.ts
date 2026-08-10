import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isLoggedIn()) {
    router.navigate(['/login']);
    return false;
  }

  // A user flagged by an admin must change their password before using the app.
  if (auth.currentUser?.mustChangePassword && !state.url.startsWith('/change-password')) {
    router.navigate(['/change-password']);
    return false;
  }

  return true;
};
