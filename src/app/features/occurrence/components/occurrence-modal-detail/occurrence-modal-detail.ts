import {ChangeDetectionStrategy, Component, computed, input} from '@angular/core';
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

  readonly imageSrc = computed((): string => {
    const o = this.occurrence();
    return o?.images?.length
      ? (o.images[0].url ?? "")
      : '/assets/images/pasdephoto.webP';
  });

  readonly imageAlt = computed((): string => {
    const o = this.occurrence();
    return o?.images?.length
      ? `Image de l'occurrence ${o.id}`
      : 'Pas d\'image';
  });

  readonly imageTitle = computed((): string => {
    const o = this.occurrence();
    return o?.images?.length
      ? `Image de l'occurrence ${o.id}`
      : 'Pas d\'image';
  });
}
