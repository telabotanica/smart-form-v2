import {ChangeDetectionStrategy, Component, effect, inject, input, OnInit, signal, viewChild} from '@angular/core';
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
import {Fiche} from '../../features/fiche/models/fiche.model';
import {Taxon} from '../../features/taxon/models/taxon.model';
import html2canvas from 'html2canvas';

interface EnrichedOccurrence extends Occurrence {
  fiche?: Fiche | null;
  taxonDetails?: Taxon | null;
  ficheExiste?: boolean;
}

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
    PdfExport
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
  readonly enrichedOccurrences = signal<EnrichedOccurrence[]>([]);
  readonly isLoadingTaxa = signal(false);
  readonly mapImageUrl = signal<string | null>(null);

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

      this.trailQrCode.set(
        `${this.sharedService.env().qrCodeUrl}${this.sentier.display_name}/${this.baseUrl}/trail/${this.id()}.png`
      );

      // Load taxa details when sentier changes
      if (this.sentier?.occurrences && this.sentier.occurrences.length > 0) {
        this.loadAllTaxaDetails();
      }
    })
  }

  ngOnInit(): void {
    this.sentierService.fetchSentier(this.id());
    this.sharedService.blurBackground.set(false)
  }

  async loadAllTaxaDetails(): Promise<void> {
    if (!this.sentier?.occurrences) return;

    this.isLoadingTaxa.set(true);
    const enriched: EnrichedOccurrence[] = [];

    for (const occurrence of this.sentier.occurrences) {
      if (!occurrence.taxon) {
        enriched.push(occurrence as EnrichedOccurrence);
        continue;
      }

      const enrichedOccurrence: EnrichedOccurrence = { ...occurrence };
      
      // Load fiche
      try {
        await this.ficheService.fetchFiche(
          occurrence.taxon.taxon_repository,
          occurrence.taxon.taxonomic_id!
        );
        if (!this.ficheService.error()) {
          enrichedOccurrence.fiche = this.ficheService.fiche();
          enrichedOccurrence.ficheExiste = true;
        } else {
          enrichedOccurrence.fiche = null;
          enrichedOccurrence.ficheExiste = false;
        }
      } catch {
        enrichedOccurrence.fiche = null;
        enrichedOccurrence.ficheExiste = false;
      }

      // Load taxon details (for images)
      try {
        await this.taxonSearchService.getTaxonFiche(
          occurrence.taxon.taxon_repository,
          occurrence.taxon.name_id
        );
        enrichedOccurrence.taxonDetails = this.taxonSearchService.taxon();
      } catch {
        enrichedOccurrence.taxonDetails = null;
      }

      enriched.push(enrichedOccurrence);
    }

    this.enrichedOccurrences.set(enriched);
    this.isLoadingTaxa.set(false);
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

  getSentierWithEnrichedOccurrences(): Sentier & { enrichedOccurrences?: EnrichedOccurrence[] } {
    return {
      ...this.sentier!,
      enrichedOccurrences: this.enrichedOccurrences()
    };
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
}
