import {ChangeDetectionStrategy, Component, signal} from '@angular/core';

@Component({
  selector: 'app-sidebar',
  imports: [],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Sidebar {
  readonly isOpen = signal(false);
  toggle(): void {
    this.isOpen.update((isOpen) => !isOpen);
  }
}
