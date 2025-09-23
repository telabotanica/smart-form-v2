import {ChangeDetectionStrategy, Component, computed, inject, input} from '@angular/core';
import {NgOptimizedImage} from '@angular/common';
import {Occurrence} from '../../models/occurrence.model';
import {SharedService} from '../../../../shared/services/shared.service';
import {OccurrenceForm} from '../occurrence-form/occurrence-form';
import {UserService} from '../../../../core/auth/services/user.service';
import {Sentier} from '../../../sentier/models/sentier.model';
import {SingleSentierService} from '../../../sentier/services/single-sentier-service';

@Component({
  selector: 'app-occurrence-modal-detail',
  imports: [NgOptimizedImage, OccurrenceForm],
  templateUrl: './occurrence-modal-detail.html',
  styleUrl: './occurrence-modal-detail.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OccurrenceModalDetail {
  readonly occurrence = input<Occurrence | null>(null);
  readonly sentier = input<Sentier >({} as Sentier);
  readonly onClose = input.required<() => void>();
  showOccurrenceForm = false;

  sharedService = inject(SharedService);
  userService = inject(UserService);
  singleSentierService = inject(SingleSentierService);

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

  openOccurrenceForm(): void {
    this.sharedService.toggleBlurBackground()
    this.showOccurrenceForm = true;
  }

  closeOccurrenceForm(): void {
    this.sharedService.toggleBlurBackground()
    this.showOccurrenceForm = false;
  }

  occurrenceUpdateSuccessed():void {
    this.singleSentierService.fetchSentier(this.sentier().id)
  }
}
