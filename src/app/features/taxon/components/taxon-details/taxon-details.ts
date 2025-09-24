import {ChangeDetectionStrategy, Component, input} from '@angular/core';
import {Taxon} from '../../models/taxon.model';

@Component({
  selector: 'app-taxon-details',
  imports: [],
  templateUrl: './taxon-details.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TaxonDetails {
  readonly taxon = input.required<Taxon>();
}
