import {ChangeDetectionStrategy, Component, inject, signal} from '@angular/core';
import {PublicTrailList} from "../public-trail-list/public-trail-list";
import {Taxon} from '../../features/taxon/models/taxon.model';
import {TaxonSearch} from '../../shared/components/taxon-search/taxon-search';
import {TaxonDetails} from '../../features/taxon/components/taxon-details/taxon-details';
import {TaxonSearchService} from '../../features/taxon/services/taxon-search-service';

@Component({
  selector: 'app-home',
  imports: [
    PublicTrailList,
    TaxonSearch,
    TaxonDetails
  ],
  templateUrl: './home.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Home {
  readonly taxon = signal<Taxon | null>(null)
  taxonSearchService = inject(TaxonSearchService);

    showTaxon(taxon: Taxon): void {
      this.taxonSearchService.getTaxonFiche(taxon)
        .then(() => {
          this.taxon.set(this.taxonSearchService.taxon());
        })
        .catch((err) => {
          console.error('Erreur lors de la récupération des détails du taxon', err);
        });
    }
}
