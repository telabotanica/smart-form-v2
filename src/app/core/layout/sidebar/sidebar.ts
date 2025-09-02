import {ChangeDetectionStrategy, Component, effect, inject, signal} from '@angular/core';
import {RouterLink} from '@angular/router';
import {User} from '../../auth/user.model';
import {UserService} from '../../auth/services/user.service';

@Component({
  selector: 'app-sidebar',
  imports: [
    RouterLink
  ],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Sidebar {
  readonly isOpen = signal(false);
  readonly isLoggedIn = signal(false);
  user: User | null = null;

  userService = inject(UserService);

  constructor() {
    this.isLoggedIn.set(this.userService.isLoggedIn());
    this.user = this.userService.user();

    effect(()=>{
      this.isLoggedIn.set(this.userService.isLoggedIn());
      this.user = this.userService.user();
    })
  }
  toggle(): void {
    this.isOpen.update((isOpen) => !isOpen);
  }
}
