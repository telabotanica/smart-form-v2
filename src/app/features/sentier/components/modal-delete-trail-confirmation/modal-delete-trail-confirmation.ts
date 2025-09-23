import {ChangeDetectionStrategy, Component, inject, input, output} from '@angular/core';
import {Sentier} from '../../models/sentier.model';
import {SharedService} from '../../../../shared/services/shared.service';
import {MesSentiersService} from '../../services/mes-sentiers-service';
import {SingleSentierService} from '../../services/single-sentier-service';
import {Occurrence} from '../../../occurrence/models/occurrence.model';

@Component({
  selector: 'app-modal-delete-trail-confirmation',
  imports: [],
  templateUrl: './modal-delete-trail-confirmation.html',
  styleUrl: './modal-delete-trail-confirmation.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ModalDeleteTrailConfirmation {
  readonly sentierToDelete = input<Sentier | null>();
  readonly occurrenceToDelete = input<Occurrence | null>();
  readonly type = input<'sentier' | 'occurrence'>('sentier');
  readonly modalClosed = output<boolean>()
  readonly modalSucceed = output<boolean>()

  sharedService = inject(SharedService);
  mesSentiersService = inject(MesSentiersService);
  sentierService= inject(SingleSentierService)

  deleteConfirmed(): void {
    if (!this.sentierToDelete()) {
      this.closeModal()
    }

    this.delete(this.sentierToDelete()!);
  }

  delete(sentier: Sentier): void {
    this.sentierService.deleteSentier(sentier)
      .then(() => {
        this.mesSentiersService.fetchMe();
        this.closeModal()
        this.modalSucceed.emit(true);
      })
      .catch(err => {
        this.closeModal()
        console.error('Erreur lors de la suppression du sentier', err);
      })
    ;
  }

  closeModal(): void {
    this.modalClosed.emit(true);
  }

  deleteOccurrence(): void {
    this.modalSucceed.emit(true);
  }
}
