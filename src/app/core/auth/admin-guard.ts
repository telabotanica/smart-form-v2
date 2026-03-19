import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { UserService } from './services/user.service';

export const adminGuard: CanActivateFn = () => {
  const userService = inject(UserService);
  const router = inject(Router);

  if (!userService.isLoggedIn() || !userService.isUserAdmin()) {
    router.navigate(['/']);
    return false;
  }

  return true;
};
