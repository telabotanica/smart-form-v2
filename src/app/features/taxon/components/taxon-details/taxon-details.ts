import {ChangeDetectionStrategy, Component, input} from '@angular/core';
import {Taxon} from '../../models/taxon.model';
import {RouterLink} from '@angular/router';

@Component({
  selector: 'app-taxon-details',
  imports: [
    RouterLink
  ],
  templateUrl: './taxon-details.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TaxonDetails {
  readonly taxon = input.required<Taxon>();
}
