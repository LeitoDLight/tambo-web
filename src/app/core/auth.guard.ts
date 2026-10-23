import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = (route) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.getToken()) {
    return router.createUrlTree(['/login']);
  }

  const rolRequerido = route.data?.['rol'];
  if (rolRequerido && auth.getUsuario()?.rol !== rolRequerido) {
    return router.createUrlTree(['/productos']);
  }
  return true;
};
