import {ChangeDetectionStrategy, Component, inject, input, output} from '@angular/core';
import {Sentier} from '../../models/sentier.model';
import {SharedService} from '../../../../shared/services/shared.service';
import {MesSentiersService} from '../../services/mes-sentiers-service';
import {SingleSentierService} from '../../services/single-sentier-service';

@Component({
  selector: 'app-modal-delete-trail-confirmation',
  imports: [],
  templateUrl: './modal-delete-trail-confirmation.html',
  styleUrl: './modal-delete-trail-confirmation.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ModalDeleteTrailConfirmation {
  readonly sentierToDelete = input.required<Sentier | null>();
  readonly modalClosed = output<boolean>()

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
}
