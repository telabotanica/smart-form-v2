import {ChangeDetectionStrategy, Component, OnInit, signal} from '@angular/core';
import {PublicTrailList} from "../../features/sentier/components/public-trail-list/public-trail-list";
import {Taxon} from '../../features/taxon/models/taxon.model';
import {TaxonSearch} from '../../shared/components/taxon-search/taxon-search';
import {TaxonDetails} from '../../features/taxon/components/taxon-details/taxon-details';
import {NgOptimizedImage} from '@angular/common';

@Component({
  selector: 'app-home',
  imports: [
    PublicTrailList,
    TaxonSearch,
    TaxonDetails,
    NgOptimizedImage
  ],
  templateUrl: './home.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Home implements OnInit {
  readonly taxon = signal<Taxon | null>(null)

  ngOnInit(): void {
    this.resetTaxonDetail();
  }
    showTaxon(taxon: Taxon): void {
      this.taxon.set(taxon);
    }

    resetTaxonDetail(): void {
      this.taxon.set(null);
    }
}
