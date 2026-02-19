import {
  ChangeDetectionStrategy,
  Component,
  effect,
  ElementRef,
  inject,
  input,
  OnInit,
  signal,
  viewChild
} from '@angular/core';
import {SingleSentierService} from '../../features/sentier/services/single-sentier-service';
import {ErrorComponent} from '../../shared/components/error/error';
import {UserService} from '../../core/auth/services/user.service';
import {User} from '../../core/auth/user.model';
import {DatePipe, NgOptimizedImage} from '@angular/common';
import {Sentier} from '../../features/sentier/models/sentier.model';
import {SentierValidationCheck} from '../../features/sentier/models/sentier-validation-check.model';
import {SentierValidationError} from '../../shared/models/sentier-validation-error.model';
import {SentierCheckErrors} from '../../shared/components/sentier-check-errors/sentier-check-errors';
import {ModalDeleteConfirmation} from '../../shared/components/modal-delete-confirmation/modal-delete-confirmation';
import {SharedService} from '../../shared/services/shared.service';
import {SentierForm} from '../../features/sentier/components/sentier-form/sentier-form';
import {Map} from '../../shared/components/map/map';
import {Loader} from '../../shared/components/loader/loader';
import {PdfExport} from '../../shared/components/pdf-export/pdf-export';
import {FicheService} from '../../features/fiche/services/fiche-service';
import {TaxonSearchService} from '../../features/taxon/services/taxon-search-service';
import {Occurrence} from '../../features/occurrence/models/occurrence.model';
import {Taxon} from '../../features/taxon/models/taxon.model';
import html2canvas from 'html2canvas';
import {QrCodeButton} from '../../shared/components/qr-code-button/qr-code-button';
import {RouterLink} from '@angular/router';
import {
  OccurrenceModalDetail
} from '../../features/occurrence/components/occurrence-modal-detail/occurrence-modal-detail';

@Component({
  selector: 'app-single-trail',
  imports: [
    ErrorComponent,
    NgOptimizedImage,
    SentierCheckErrors,
    ModalDeleteConfirmation,
    DatePipe,
    SentierForm,
    Map,
    Loader,
    PdfExport,
    QrCodeButton,
    RouterLink,
    OccurrenceModalDetail
  ],
  templateUrl: './single-trail.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SingleTrail implements OnInit {
  user: User | null = null;
  sentierToDelete: Sentier | null = null;
  sentierToUpdate: Sentier | null = null;
  showDeleteConfirmModal = false;
  sentier: Sentier | null = null;
  showTrailModal = false;

  readonly id = input.required<number>()
  readonly isLoggedIn = signal(false);
  readonly sentierCheck = signal({} as SentierValidationCheck);
  readonly sentierCheckError = signal<SentierValidationError | null>(null);
  readonly trailQrCode= signal("");
  readonly mapImageUrl = signal<string | null>(null);
  readonly taxons = signal<Taxon[]>([]);
  readonly occurencesUniques = signal<Occurrence[]>([]);
  readonly occurrenceDialog = viewChild<ElementRef<HTMLDialogElement>>('occurrenceListDialog');
  readonly selectedOccurrence = signal<Occurrence | null>(null);

  readonly mapComponent = viewChild<Map>('mapComponent');

  sentierService= inject(SingleSentierService)
  userService = inject(UserService);
  sharedService = inject(SharedService);
  ficheService = inject(FicheService);
  taxonSearchService = inject(TaxonSearchService);

  baseUrl = this.sharedService.url().origin

  constructor() {
    this.isLoggedIn.set(this.userService.isLoggedIn());
    this.user = this.userService.user();

    effect(()=>{
      this.isLoggedIn.set(this.userService.isLoggedIn());
      this.user = this.userService.user();
      this.sentier = this.sentierService.sentier();

      this.fillUniqueOccurrences();

      this.trailQrCode.set(
        `${this.sharedService.env().qrCodeUrl}${this.sentier.display_name}/${this.baseUrl}/trail/${this.id()}.png`
      );
    })

    effect(()=>{
      this.taxons.set(this.taxonSearchService.taxons());
      // console.log(this.taxons())
    })
  }

  ngOnInit(): void {
    this.sentierService.fetchSentier(this.id());
    this.taxonSearchService.getUniqueTaxonsBelongingToTrail(this.id())
    this.sharedService.blurBackground.set(false)
  }

  fillUniqueOccurrences(): void{
    const occurrences = this.sentier!.occurrences ?? [];
    const seen = new Set<number>();
    const uniques = occurrences.filter(o => {
      if (!o.taxon?.name_id || seen.has(o.taxon?.name_id)) return false;
      seen.add(o.taxon?.name_id);
      return true;
    });
    this.occurencesUniques.set(uniques);
  }

  async captureMap(): Promise<void> {
    const mapComponent = this.mapComponent();
    if (!mapComponent) {
      this.mapImageUrl.set(null);
      return;
    }

    // Force map render before capture
    mapComponent.forceRender();

    // Wait for render to complete
    await new Promise(resolve => setTimeout(resolve, 300));

    const mapElement = document.querySelector('app-map .leaflet-container') as HTMLElement;
    if (!mapElement) {
      this.mapImageUrl.set(null);
      return;
    }

    try {
      const canvas = await html2canvas(mapElement, {
        useCORS: true,
        allowTaint: true,
        scale: 2,
        logging: false
      });
      const dataUrl = canvas.toDataURL('image/png');
      this.mapImageUrl.set(dataUrl);
    } catch {
      this.mapImageUrl.set(null);
    }
  }

  async checkSentier(sentier: Sentier): Promise<void> {
    const { check, error } = await this.sentierService.checkSentier(sentier);
    this.sentierCheck.set(check);
    this.sentierCheckError.set(error);
  }

  openDeleteConfirmModal(sentier: Sentier): void {
    this.sharedService.toggleBlurBackground()
    this.sentierToDelete = sentier;
    this.showDeleteConfirmModal = true;
  }

  closeDeleteConfirmModal(): void {
    this.sharedService.toggleBlurBackground()
    this.sentierToDelete = null;
    this.showDeleteConfirmModal = false;
    this.sentierService.fetchSentier(this.id());
  }

  openTrailModal(sentier: Sentier | null = null): void {
    this.sharedService.toggleBlurBackground()
    this.sentierToUpdate = sentier
    this.showTrailModal = true;
  }

  closeTrailModal(): void {
    this.sharedService.toggleBlurBackground()
    this.sentierToUpdate = null;
    this.showTrailModal = false;
    this.sentierService.fetchSentier(this.id());
  }

  async sendTrailToReview(sentier: Sentier): Promise<void> {
    await this.sentierService.reviewSentier(sentier);
  }

  openOccurrence(o: Occurrence): void {
    this.selectedOccurrence.set(o);
    this.occurrenceDialog()?.nativeElement?.showModal();
  }

  closeOccurrence = (): void => {
    this.occurrenceDialog()?.nativeElement?.close();
    this.selectedOccurrence.set(null);
  };
}
