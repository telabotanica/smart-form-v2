import {ChangeDetectionStrategy, Component, input} from '@angular/core';
import {NgOptimizedImage} from '@angular/common';
import {Occurrence} from '../../models/occurrence.model';

@Component({
  selector: 'app-occurrence-modal-detail',
  imports: [NgOptimizedImage],
  templateUrl: './occurrence-modal-detail.html',
  styleUrl: './occurrence-modal-detail.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OccurrenceModalDetail {
  readonly occurrence = input<Occurrence | null>(null);
  readonly onClose = input.required<() => void>();
}
