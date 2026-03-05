import {ChangeDetectionStrategy, Component, computed, inject, input, output} from '@angular/core';
import {Sentier} from '../../../features/sentier/models/sentier.model';
import {SharedService} from '../../services/shared.service';
import {MesSentiersService} from '../../../features/sentier/services/mes-sentiers-service';
import {SingleSentierService} from '../../../features/sentier/services/single-sentier-service';
import {Occurrence} from '../../../features/occurrence/models/occurrence.model';
import {Router} from '@angular/router';

type ModalType = 'sentier' | 'occurrence' | 'publish' | 'reject' | 'unpublish' | 'trailPicture';

type ModalConfig = {
  title: string;
  message: string;
  confirmLabel: string;
  confirmClass: string;
  icon: string;
}

const MODAL_CONFIGS: Record<ModalType, ModalConfig> = {
  sentier: {
    title: 'Supprimer le sentier',
    message: 'Cette action est irréversible !',
    confirmLabel: 'Oui, supprimer',
    confirmClass: 'bg-red-800 hover:bg-red-600 text-white border-red-800',
    icon: '🗑️',
  },
  occurrence: {
    title: 'Supprimer l\'individu',
    message: 'Cette action est irréversible !',
    confirmLabel: 'Oui, supprimer',
    confirmClass: 'bg-red-800 hover:bg-red-600 text-white border-red-800',
    icon: '🗑️',
  },
  publish: {
    title: 'Publier le sentier',
    message: 'Le sentier sera rendu public et visible par tous les utilisateurs.',
    confirmLabel: '✅ Oui, publier',
    confirmClass: 'bg-accent hover:bg-accent-700 text-white border-accent',
    icon: '✅',
  },
  reject: {
    title: 'Refuser le sentier',
    message: 'Le sentier sera remis au statut brouillon.',
    confirmLabel: '❌ Oui, refuser',
    confirmClass: 'bg-red-800 hover:bg-red-600 text-white border-red-800',
    icon: '❌',
  },
  unpublish: {
    title: 'Dépublier le sentier',
    message: 'Le sentier sera remis au statut brouillon.',
    confirmLabel: '❌ Oui, dépublier',
    confirmClass: 'bg-red-800 hover:bg-red-600 text-white border-red-800',
    icon: '❌',
  },
  trailPicture: {
    title: 'Supprimer la photo',
    message: 'La photo sera supprimée.',
    confirmLabel: '❌ Oui, supprimer',
    confirmClass: 'bg-red-800 hover:bg-red-600 text-white border-red-800',
    icon: '❌',
  },
};

@Component({
  selector: 'app-modal-confirmation',
  imports: [],
  templateUrl: './modal-confirmation.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ModalConfirmation {
  readonly sentierToDelete = input<Sentier | null>();
  readonly occurrenceToDelete = input<Occurrence | null>();
  readonly type = input<ModalType>('sentier');
  readonly modalClosed = output<boolean>();
  readonly modalSucceed = output<boolean>();

  readonly config = computed(() => MODAL_CONFIGS[this.type()]);

  sharedService = inject(SharedService);
  mesSentiersService = inject(MesSentiersService);
  sentierService = inject(SingleSentierService);
  private readonly router = inject(Router);

  confirm(): void {
    switch (this.type()) {
      case 'sentier':
        if (!this.sentierToDelete()) { this.closeModal(); return; }
        this.deleteSentier(this.sentierToDelete()!);
        break;
      case 'occurrence':
        this.modalSucceed.emit(true);
        break;
      case 'publish':
        this.modalSucceed.emit(true);
        this.closeModal();
        break;
      case 'reject':
        this.modalSucceed.emit(true);
        this.closeModal();
        break;
      case 'unpublish':
        this.modalSucceed.emit(true);
        this.closeModal();
        break;
      case 'trailPicture':
        this.modalSucceed.emit(true);
        this.closeModal();
        break;
    }
  }

  async deleteSentier(sentier: Sentier): Promise<void> {
    this.sentierService.deleteSentier(sentier)
      .then(() => {
        this.mesSentiersService.fetchMe();
        this.closeModal();
        this.modalSucceed.emit(true);
        this.router.navigate(['/me']);
      })
      .catch(err => {
        this.closeModal();
        console.error('Erreur lors de la suppression du sentier', err);
      });
  }

  closeModal(): void {
    this.modalClosed.emit(true);
  }
}
