import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { UserService } from '../../auth/services/user.service';

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Sidebar {
  readonly isOpen = signal(false);
  readonly userService = inject(UserService);

  toggle(): void {
    this.isOpen.update((open) => !open);
  }
}
