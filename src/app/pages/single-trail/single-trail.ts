import {
  ChangeDetectionStrategy,
  Component, computed,
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
import {ModalConfirmation} from '../../shared/components/modal-confirmation/modal-confirmation';
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
import {
  OccurrenceModalDetail
} from '../../features/occurrence/components/occurrence-modal-detail/occurrence-modal-detail';
import {OccurrenceCard} from '../../features/occurrence/components/occurrence-card/occurrence-card';
import {PdfExportService} from '../../shared/components/pdf-export/pdf-export.service';
import {Router} from '@angular/router';
import {AdminService} from '../../features/admin/services/admin-service';
import {PingService} from '../../features/ping/services/ping.service';
import {Ping} from '../../features/ping/models/ping.model';
import {FicheForm} from '../../features/fiche/components/fiche-form/fiche-form';
import {FicheModalService} from '../../features/fiche/services/fiche-modal.service';
import {Unauthorized} from '../../core/pages/unauthorized/unauthorized';

@Component({
  selector: 'app-single-trail',
  imports: [
    ErrorComponent,
    NgOptimizedImage,
    SentierCheckErrors,
    ModalConfirmation,
    DatePipe,
    SentierForm,
    Map,
    Loader,
    PdfExport,
    OccurrenceModalDetail,
    OccurrenceCard,
    FicheForm,
    Unauthorized
  ],
  templateUrl: './single-trail.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SingleTrail implements OnInit {
  user: User | null = null;
  sentierToDelete: Sentier | null = null;
  sentierToUpdate: Sentier | null = null;
  sentier: Sentier | null = null;

  showDeleteConfirmModal = false;
  showTrailModal = false;
  showPublishConfirmModal = false;
  showRejectConfirmModal = false;
  showUnpublishConfirmModal = false;

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
  private readonly _pingReady = signal(false);
  readonly pings = signal(0);
  readonly accessAuthorized = signal(false);

  readonly mapComponent = viewChild<Map>('mapComponent');

  readonly seasonImages = ['arbre.png', 'sunny.png', 'maple-leaf.png', 'flocon-de-neige.png'];
  readonly seasonLabels = ['Printemps', 'Été', 'Automne', 'Hiver'];

  sentierService= inject(SingleSentierService)
  userService = inject(UserService);
  sharedService = inject(SharedService);
  ficheService = inject(FicheService);
  taxonSearchService = inject(TaxonSearchService);
  pdfExportService = inject(PdfExportService);
  adminService = inject(AdminService);
  pingService = inject(PingService);
  private router = inject(Router);
  readonly ficheModalService = inject(FicheModalService);

  readonly baseUrl = computed(() => {
    const u = this.sharedService.url();
    return u.origin + u.pathname;
  });

  constructor() {
    effect(() => {
      this.isLoggedIn.set(this.userService.isLoggedIn());
      this.user = this.userService.user();
      if (this.userService.isReady()) {
        this._pingReady.set(true);
      }
    });

    effect(()=>{
      this.sentier = this.sentierService.sentier();
      const pingReady = this._pingReady();

      if (this.sentier) {
        this.pingService.fetchPings(this.sentier);

        if (pingReady) {
          this.trySendPing(this.sentier);
        }

        this.checkAccess(this.sentier);
      }

      this.fillUniqueOccurrences();

      this.trailQrCode.set(
        `${this.sharedService.env().qrCodeUrl}${this.sentier.display_name}/${this.baseUrl()}}.png`
      );

    })

    effect(() => {
      const pingList = this.pingService.pings();
      this.pings.set(pingList.length)
    });
    effect(()=>{
      this.taxons.set(this.taxonSearchService.taxons());
    })
  }

  ngOnInit(): void {
    this.sentierService.fetchSentier(this.id());
    this.taxonSearchService.getUniqueTaxonsBelongingToTrail(this.id())
    this.sharedService.blurBackground.set(false)
  }

  private checkAccess(sentier: Sentier): void {
    this.accessAuthorized.set(false);
    if (sentier.status?.toLowerCase() === 'Validé'.toLowerCase()) {
      this.accessAuthorized.set(true);
    }

    let isAuthor = null;
    if (this.user && sentier.author_id) {
       isAuthor = this.user.id === sentier.author_id;
    }

    if (this.userService.isUserAdmin() || isAuthor) {
      this.accessAuthorized.set(true);
    }
  }

  fillUniqueOccurrences(): void{
    const occurrences = this.sentier!.occurrences ?? [];
    const seen = new Set<number>();
    const uniques = occurrences.filter(o => {
      if (!o.taxon?.name_id || seen.has(o.taxon?.name_id)){ return false };
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
    // this.sharedService.blurBackground.set(true)
  }

  closeOccurrence = (): void => {
    this.occurrenceDialog()?.nativeElement?.close();
    this.selectedOccurrence.set(null);
    // this.sharedService.blurBackground.set(false)
  };

  closeFicheModal(): void {
    this.ficheModalService.close();
    this.taxonSearchService.getUniqueTaxonsBelongingToTrail(this.id())
  }

  /*********************** ADMIN *********************/
  openPublishConfirmModal(): void {
    this.sharedService.blurBackground.set(true)
    this.showPublishConfirmModal = true;
  }

  closePublishConfirmModal(): void {
    this.sharedService.blurBackground.set(false)
    this.showPublishConfirmModal = false;
  }

  openRejectConfirmModal(): void {
    this.sharedService.blurBackground.set(true)
    this.showRejectConfirmModal = true;
  }

  closeRejectConfirmModal(): void {
    this.sharedService.blurBackground.set(false)
    this.showRejectConfirmModal = false;
  }

  openUnpublishConfirmModal(): void {
    this.sharedService.blurBackground.set(true)
    this.showUnpublishConfirmModal = true;
  }

  closeUnpublishConfirmModal(): void {
    this.sharedService.blurBackground.set(false)
    this.showUnpublishConfirmModal = false;
  }

  async adminPublishTrail(): Promise<void> {
    await this.adminService.publishSentier(this.sentier!)
    this.closePublishConfirmModal();
    this.sentierService.fetchSentier(this.id());
  }

  async adminRejectTrail(): Promise<void> {
    await this.adminService.rejectSentier(this.sentier!)
    this.closeRejectConfirmModal();
    this.sentierService.fetchSentier(this.id());
  }

  async adminUnpublishTrail(): Promise<void> {
    await this.adminService.unpublishSentier(this.sentier!)
    this.closeUnpublishConfirmModal();
    this.sentierService.fetchSentier(this.id());
  }

  /*****************************************/

  private trySendPing(sentier: Sentier): void {
    const isValidated = sentier.status?.toLowerCase() === 'validé';
    if (!isValidated) { return; }

    const isAuthor = this.user?.id === sentier.author_id;
    if (isAuthor) { return; }

    this.pingService.savePing({
      is_logged: this.isLoggedIn(),
      is_located: false,
      is_online: true,
      date: new Date().toISOString(),
      trail: sentier.id,
      from_website: true,
    } as Ping);
  }

}
