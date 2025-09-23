import {ChangeDetectionStrategy, Component, inject, input, output} from '@angular/core';
import {Sentier} from '../../../features/sentier/models/sentier.model';
import {SharedService} from '../../services/shared.service';
import {MesSentiersService} from '../../../features/sentier/services/mes-sentiers-service';
import {SingleSentierService} from '../../../features/sentier/services/single-sentier-service';
import {Occurrence} from '../../../features/occurrence/models/occurrence.model';
import {Router} from '@angular/router';

@Component({
  selector: 'app-modal-delete-trail-confirmation',
  imports: [],
  templateUrl: './modal-delete-confirmation.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ModalDeleteConfirmation {
  readonly sentierToDelete = input<Sentier | null>();
  readonly occurrenceToDelete = input<Occurrence | null>();
  readonly type = input<'sentier' | 'occurrence'>('sentier');
  readonly modalClosed = output<boolean>()
  readonly modalSucceed = output<boolean>()

  sharedService = inject(SharedService);
  mesSentiersService = inject(MesSentiersService);
  sentierService= inject(SingleSentierService)
  private readonly router = inject(Router);

  deleteConfirmed(): void {
    if (!this.sentierToDelete()) {
      this.closeModal()
    }

    this.delete(this.sentierToDelete()!);
  }

  async delete(sentier: Sentier): Promise<void> {
    this.sentierService.deleteSentier(sentier)
      .then(() => {
        this.mesSentiersService.fetchMe();
        this.closeModal()
        this.modalSucceed.emit(true);
        this.router.navigate(['/me']);
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
