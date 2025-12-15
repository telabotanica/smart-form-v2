import {ChangeDetectionStrategy, Component, inject, input, OnInit} from '@angular/core';
import {TaxonSearchService} from '../../features/taxon/services/taxon-search-service';
import {Loader} from '../../shared/components/loader/loader';
import {WikiToHtmlPipe} from '../../features/fiche/pipes/WikiToHtmlPipe';
import {MarkdownPipe} from '../../features/fiche/pipes/MarkdownPipe';
import {ErrorComponent} from '../../shared/components/error/error';

@Component({
  selector: 'app-fiche',
  imports: [
    Loader,
    WikiToHtmlPipe,
    MarkdownPipe,
    ErrorComponent
  ],
  templateUrl: './fiche.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Fiche implements OnInit {
  readonly referentiel = input.required<string>()
  readonly num_taxonomic = input.required<number>()
  readonly num_nom = input.required<number>()

  taxonSearchService = inject(TaxonSearchService);

  ngOnInit(): void {
    this.taxonSearchService.getTaxonFiche(this.referentiel(), this.num_nom())
  }
}
