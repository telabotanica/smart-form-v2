import {ChangeDetectionStrategy, Component, effect, inject, input, output, signal} from '@angular/core';
import { Position } from '../../../shared/models/position.model';
import {UserService} from '../../../core/auth/services/user.service';
import {SharedService} from '../../services/shared.service';
import {SingleSentierService} from '../../../features/sentier/services/single-sentier-service';
import {User} from '../../../core/auth/user.model';

@Component({
  selector: 'app-waypoint-list',
  imports: [],
  templateUrl: './waypoint-list.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class WaypointListComponent {
  readonly points = input<Position[] | null>(null);
  readonly reorder = output<Position[]>();
  readonly remove = output<number>();

  // user: User | null = null;

  readonly canEditTrail = signal(false)
  private readonly draggingIndex = signal<number | null>(null);

  userService = inject(UserService);
  sharedService = inject (SharedService)
  sentierService = inject(SingleSentierService)

  // constructor() {
  //   this.user = this.userService.user();
  //   const canEdit = this.sharedService.canEditTrail(this.user, this.sentierService.sentier())
  //   this.canEditTrail.set(canEdit)
  //
  //   effect(() => {
  //     this.user = this.userService.user();
  //     const canEdit = this.sharedService.canEditTrail(this.user, this.sentierService.sentier())
  //     this.canEditTrail.set(canEdit)
  //     console.log(this.canEditTrail())
  //     console.log(this.user)
  //   })
  //
  //   console.log(this.canEditTrail())
  // }

  // Event handlers
  onDragStart(ev: DragEvent, index: number): void {
    this.draggingIndex.set(index);
    // Set a drag image to improve UX (optional)
    if (ev.dataTransfer) {
      ev.dataTransfer.effectAllowed = 'move';
      ev.dataTransfer.setData('text/plain', String(index));
    }
  }

  onDragOver(ev: DragEvent): void {
    ev.preventDefault(); // Necessary to allow drop
    if (ev.dataTransfer) {
      ev.dataTransfer.dropEffect = 'move';
    }
  }

  onDrop(ev: DragEvent): void {
    ev.preventDefault();
    const from = this.draggingIndex();
    if (from === null) { return; }

    // Determine target index: find closest LI ancestor and read its data-index
    const targetLi = (ev.target as HTMLElement).closest('li[data-index]') as HTMLElement | null;
    if (!targetLi) { this.onDragEnd(); return; }
    const to = Number(targetLi.dataset['index']);
    if (Number.isNaN(to) || to === from) { this.onDragEnd(); return; }

    const arr = (this.points() ?? []).slice();
    if (from < 0 || from >= arr.length || to < 0 || to >= arr.length) { this.onDragEnd(); return; }

    const [moved] = arr.splice(from, 1);
    arr.splice(to, 0, moved);
    this.reorder.emit(arr);
    this.onDragEnd();
  }

  onDragEnd(): void {
    this.draggingIndex.set(null);
  }
}
