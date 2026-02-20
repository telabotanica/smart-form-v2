import {ChangeDetectionStrategy, Component, inject, input, OnInit, signal} from '@angular/core';
import {TaxonSearchService} from '../../features/taxon/services/taxon-search-service';
import {Loader} from '../../shared/components/loader/loader';
import {WikiToHtmlPipe} from '../../features/fiche/pipes/WikiToHtmlPipe';
import {MarkdownPipe} from '../../features/fiche/pipes/MarkdownPipe';
import {ErrorComponent} from '../../shared/components/error/error';
import {SharedService} from '../../shared/services/shared.service';
import {FicheService} from '../../features/fiche/services/fiche-service';
import {Fiche} from '../../features/fiche/models/fiche.model';
import {FicheForm} from '../../features/fiche/components/fiche-form/fiche-form';
import {UserService} from '../../core/auth/services/user.service';

@Component({
  selector: 'app-fiche',
  imports: [
    Loader,
    WikiToHtmlPipe,
    MarkdownPipe,
    ErrorComponent,
    FicheForm
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

  taxonSearchService = inject(TaxonSearchService);
  sharedService = inject(SharedService);
  ficheService = inject(FicheService);
  userService = inject(UserService);

  ngOnInit(): void {
    this.taxonSearchService.getTaxonFiche(this.referentiel(), this.num_nom())
  }

  async editFicheModal(): Promise<void> {
    this.fiche.set(null);
    await this.ficheService.fetchFiche(
      this.referentiel(),
      this.num_nom()
    )
    this.fiche.set(this.ficheService.fiche());
    this.showFicheModal.set(true);
    this.sharedService.toggleBlurBackground()
  }

  closeFicheModal(): void {
    this.fiche.set(null);
    this.showFicheModal.set(false);
    this.sharedService.toggleBlurBackground()
  }
}
