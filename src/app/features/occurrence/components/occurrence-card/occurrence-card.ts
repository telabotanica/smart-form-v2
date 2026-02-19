import {ChangeDetectionStrategy, Component, inject, input, output} from '@angular/core';
import {Occurrence} from '../../models/occurrence.model';
import {TaxonSearchService} from '../../../taxon/services/taxon-search-service';
import {QrCodeButton} from '../../../../shared/components/qr-code-button/qr-code-button';
import {RouterLink} from '@angular/router';
import {Loader} from '../../../../shared/components/loader/loader';
import {Taxon} from '../../../taxon/models/taxon.model';

@Component({
  selector: 'app-occurrence-card',
  imports: [
    QrCodeButton,
    RouterLink,
    Loader
  ],
  templateUrl: './occurrence-card.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OccurrenceCard {
  readonly occurrence = input.required<Occurrence>();
  readonly openOccurrence = output<Occurrence>();

  taxonSearchService = inject(TaxonSearchService);

  get fullTaxon(): Taxon | null {
    return this.taxonSearchService.getFullTaxon(this.occurrence());
  }

  get hasFiche(): boolean {
    return this.taxonSearchService.hasFiche(this.occurrence());
  }

  get isFicheComplete(): boolean {
    return this.fullTaxon ? this.taxonSearchService.isFicheFullyCompleted(this.fullTaxon) : false;
  }
}
