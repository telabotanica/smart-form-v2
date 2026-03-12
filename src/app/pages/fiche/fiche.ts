import {ChangeDetectionStrategy, Component, computed, effect, inject, input, OnInit, signal} from '@angular/core';
import {TaxonSearchService} from '../../features/taxon/services/taxon-search-service';
import {Loader} from '../../shared/components/loader/loader';
import {WikiToHtmlPipe} from '../../features/fiche/pipes/WikiToHtmlPipe';
import {ErrorComponent} from '../../shared/components/error/error';
import {SharedService} from '../../shared/services/shared.service';
import {FicheService} from '../../features/fiche/services/fiche-service';
import {Fiche} from '../../features/fiche/models/fiche.model';
import {Image} from '../../features/image/models/image.model';
import {FicheForm} from '../../features/fiche/components/fiche-form/fiche-form';
import {UserService} from '../../core/auth/services/user.service';
import {ImageCarousel} from '../../shared/components/image-carousel/image-carousel';
import {FicheModalService} from '../../features/fiche/services/fiche-modal.service';
import {PdfExport} from '../../shared/components/pdf-export/pdf-export';

@Component({
  selector: 'app-fiche',
  imports: [
    Loader,
    WikiToHtmlPipe,
    ErrorComponent,
    FicheForm,
    ImageCarousel,
    PdfExport
  ],
  templateUrl: './fiche.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FichePage implements OnInit {
  readonly referentiel = input.required<string>()
  readonly num_taxonomic = input.required<number>()
  readonly num_nom = input.required<number>()

  readonly showFicheModal = signal(false);
  readonly fiche = signal<Fiche | null>(null);
  // readonly images = signal<Image[]>([])
  readonly images = computed<Image[]>(() => {
    const tabs = this.taxonSearchService.taxon()?.tabs ?? [];
    return tabs.find((tab) => tab.title === 'Galerie')?.images?.slice(0, 10) ?? [];
  });

  taxonSearchService = inject(TaxonSearchService);
  sharedService = inject(SharedService);
  ficheService = inject(FicheService);
  userService = inject(UserService);
  readonly ficheModalService = inject(FicheModalService);

  constructor() {
    effect(() => {
      this.fiche.set(this.ficheService.fiche());
    });
  }

  ngOnInit(): void {
    this.taxonSearchService.getTaxonFiche(this.referentiel(), this.num_nom())
    this.ficheService.fetchFiche(
      this.referentiel(),
      this.num_taxonomic()
    );
  }

  async editFicheModal(): Promise<void> {
    this.ficheModalService.open(this.fiche());
  }

  closeFicheModal(): void {
    this.ficheModalService.close();
  }

  refreshFiche(): void {
    this.taxonSearchService.getTaxonFiche(this.referentiel(), this.num_nom())
    this.ficheModalService.close()
  }
}
