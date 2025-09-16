import {DestroyRef, inject, Injectable, signal} from '@angular/core';
import {User} from '../user.model';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {AuthApiService} from './auth-api.service';
import {CookiesService} from './cookies.service';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  readonly userId = signal("");
  readonly user = signal<User | null>(null);
  readonly isLoggedIn = signal(false);
  readonly isUserAdmin = signal(false);

  authApiService = inject(AuthApiService);
  destroyRef = inject(DestroyRef);
  customCookiesService = inject(CookiesService);

  setUserId(id: string): void {
    this.userId.set(id);
  }

  setUser(user: User | null): void{
    this.user.set(user)
  }

  // setAdmin(user: User | null): void{
  //   if (user) {
  //     user.admin = this.isAdmin(user) ? 1 : 0;
  //   }
  //   this.user.set({...this.user(), admin: user?.admin} as User) ;
  // }

  setLoggedIn(status: boolean): void{
    this.isLoggedIn.set(status);
  }

  toggleLoggedIn(): void{
    this.isLoggedIn.set(!this.isLoggedIn());
  }

  // isAdmin(user:User|null = null): boolean{
  //   // const user: User | null = this.user();
  //   if (!user ) {
  //     return false;
  //   }
  //
  //   switch (user.admin){
  //     case 1:
  //       return true;
  //     default:
  //       return false
  //   }
  // }

  setUserData(token: string): void {
    const userData = this.customCookiesService.userInfos(token);
    const user = new User(userData.id, userData.intitule, userData.sub, userData.avatar, token, 0, []);
    this.setUserId(userData.id)
    this.setLoggedIn(true);
    this.addAdminRole(user);
    this.setUser(user);
  }

  addAdminRole(user: User | null = null): void{
    this.authApiService.isAdmin(user?.token || '')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          if (user instanceof User) {
            user.admin = data ? 1 : 0;
            this.isUserAdmin.set(data)
          }
        },
        error: (err) => {
          console.error(err)
        }
      });
  }

}
