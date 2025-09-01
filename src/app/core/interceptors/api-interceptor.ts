import {HttpInterceptorFn} from '@angular/common/http';
import {inject} from '@angular/core';
import {UserService} from '../auth/services/user.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const userService = inject(UserService);
  const user = userService.user();

  if (user?.token) {
    const cloned = req.clone({
      setHeaders: {
        Authorization: user.token,
      },
    });
    return next(cloned);
  }

  return next(req);
};
