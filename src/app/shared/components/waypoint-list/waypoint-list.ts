import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { Position } from '../../../shared/models/position.model';

@Component({
  selector: 'app-waypoint-list',
  imports: [],
  templateUrl: './waypoint-list.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class WaypointListComponent {
  // Inputs/Outputs using Angular v20 functions
  readonly points = input<Position[] | null>(null);
  readonly reorder = output<Position[]>();
  readonly remove = output<number>();

  private readonly draggingIndex = signal<number | null>(null);

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
