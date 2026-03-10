import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input, output,
  signal,
} from '@angular/core';
import { Occurrence } from '../../models/occurrence.model';
import { SharedService } from '../../../../shared/services/shared.service';
import { OccurrenceForm } from '../occurrence-form/occurrence-form';
import { UserService } from '../../../../core/auth/services/user.service';
import { Sentier } from '../../../sentier/models/sentier.model';
import { SingleSentierService } from '../../../sentier/services/single-sentier-service';
import { OccurrenceService } from '../../services/occurrence-service';
import { ModalConfirmation } from '../../../../shared/components/modal-confirmation/modal-confirmation';
import { RouterLink } from '@angular/router';
import { Fiche } from '../../../fiche/models/fiche.model';
import { FicheForm } from '../../../fiche/components/fiche-form/fiche-form';
import { FicheService } from '../../../fiche/services/fiche-service';
import { QrCodeButton } from '../../../../shared/components/qr-code-button/qr-code-button';
import { PdfExport } from '../../../../shared/components/pdf-export/pdf-export';
import { PdfExportService } from '../../../../shared/components/pdf-export/pdf-export.service';
import { TaxonSearchService } from '../../../taxon/services/taxon-search-service';
import { Taxon } from '../../../taxon/models/taxon.model';
import { ImageCarousel } from '../../../../shared/components/image-carousel/image-carousel';
import {FicheModalService} from '../../../fiche/services/fiche-modal.service';
import {Loader} from '../../../../shared/components/loader/loader';

@Component({
  selector: 'app-occurrence-modal-detail',
  imports: [
    OccurrenceForm,
    ModalConfirmation,
    RouterLink,
    FicheForm,
    QrCodeButton,
    PdfExport,
    ImageCarousel,
    Loader,
  ],
  templateUrl: './occurrence-modal-detail.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OccurrenceModalDetail {
  readonly occurrence = input<Occurrence | null>(null);
  readonly sentier = input<Sentier>({} as Sentier);
  readonly onClose = input.required<() => void>();
  readonly closeOccurrenceModal = output<boolean >();

  showOccurrenceForm = false;
  showDeleteConfirmModal = false;
  readonly showFicheModal = signal(false);
  readonly fiche = signal<Fiche | null>(null);
  readonly taxonInfos = signal<Taxon | null>(null);
  readonly ficheExiste = signal(false);

  readonly sharedService = inject(SharedService);
  readonly userService = inject(UserService);
  readonly singleSentierService = inject(SingleSentierService);
  readonly occurrenceService = inject(OccurrenceService);
  readonly ficheService = inject(FicheService);
  readonly taxonSearchService = inject(TaxonSearchService);
  readonly exportService = inject(PdfExportService);
  readonly ficheModalService = inject(FicheModalService);

  readonly images = computed(() => this.occurrence()?.images ?? []);

  constructor() {
    effect(() => {
      const occurrence = this.occurrence();
      if (!occurrence) { return; }

      this.fiche.set(null);
      this.ficheExiste.set(false);
      this.fetchFiche(occurrence);
    });
  }

  async deleteOccurrence(): Promise<void> {
    await this.occurrenceService.deleteOccurrence(this.occurrence()!).then(() => {
      this.reloadTrail();
      this.sharedService.toggleBlurBackground();
      this.sharedService.toggleBlurBackgroundModal();
    });
  }

  reloadTrail(): void {
    const occurrence = this.occurrence();
    if (!occurrence) { return; }

    this.fetchFiche(occurrence);
    this.getDetailTaxonInfos(occurrence);
    this.singleSentierService.fetchSentier(this.sentier().id);
  }

  openDeleteConfirmation(): void {
    this.sharedService.toggleBlurBackground();
    this.sharedService.toggleBlurBackgroundModal();
    this.showDeleteConfirmModal = true;
  }

  closeDeleteConfirmModal(): void {
    this.sharedService.toggleBlurBackground();
    this.sharedService.toggleBlurBackgroundModal();
    this.showDeleteConfirmModal = false;
  }

  openOccurrenceForm(): void {
    this.sharedService.toggleBlurBackground();
    this.sharedService.toggleBlurBackgroundModal();
    this.showOccurrenceForm = true;
  }

  closeOccurrenceForm(): void {
    this.sharedService.toggleBlurBackground();
    this.sharedService.toggleBlurBackgroundModal();
    this.showOccurrenceForm = false;
  }

  occurrenceUpdateSuccessed(): void {
    this.singleSentierService.fetchSentier(this.sentier().id);
  }

  async editFicheModal(): Promise<void> {
    this.fiche.set(null);
    await this.ficheService.fetchFiche(
      this.occurrence()!.taxon!.taxon_repository!,
      this.occurrence()!.taxon!.taxonomic_id!,
    );
    this.fiche.set(this.ficheService.fiche());
    this.ficheModalService.open(this.fiche());
    this.ficheModalService.occurrence.set(this.occurrence());
    this.onClose()()
  }

  createFicheModal(): void {
    this.fiche.set(null);
    this.ficheModalService.open(null);
    this.onClose()()
  }

  closeFicheModal(): void {
    this.fiche.set(null);
    this.ficheModalService.close();
  }

  ficheCreationSuccess(): void {
    this.reloadTrail();
  }

  fetchFiche(occurrence: Occurrence): void {
    if (!occurrence) { return; }

    this.fiche.set(null);
    this.ficheService
      .fetchFiche(this.occurrence()!.taxon!.taxon_repository, this.occurrence()!.taxon!.taxonomic_id!)
      .then(() => {
        if (!this.ficheService.error()) {
          this.fiche.set(this.ficheService.fiche());
          this.ficheExiste.set(true);
          this.getDetailTaxonInfos(occurrence);
        } else {
          this.fiche.set(null);
          this.ficheExiste.set(false);
        }
      })
      .catch((err) => {
        console.error('Erreur lors de la récupération de la fiche', err);
        this.fiche.set(null);
        this.ficheExiste.set(false);
      });
  }

  getDetailTaxonInfos(occurrence: Occurrence): void {
    if (!occurrence) { return; }

    this.taxonSearchService
      .getTaxonFiche(this.occurrence()!.taxon!.taxon_repository, this.occurrence()!.taxon!.name_id)
      .then(() => {
        this.taxonInfos.set(this.taxonSearchService.taxon());
      })
      .catch((err) => {
        console.error('Erreur lors de la récupération des détails du taxon', err);
      });
  }

  getFirstImageUrl(): string | null {
    const taxon = this.taxonInfos();
    if (!taxon) { return null; }

    return this.exportService.getFirstImageUrl(taxon);
  }
}
