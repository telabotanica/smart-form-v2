import {ChangeDetectionStrategy, Component, inject, input} from '@angular/core';
import {Taxon} from '../../features/taxon/models/taxon.model';
import {TaxonSearchService} from '../../features/taxon/services/taxon-search-service';
import {Loader} from '../../shared/components/loader/loader';
import {marked} from 'marked';
import {DomSanitizer, SafeHtml} from '@angular/platform-browser';

@Component({
  selector: 'app-fiche',
  imports: [
    Loader
  ],
  templateUrl: './fiche.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Fiche {
  readonly referentiel = input.required<string>()
  readonly num_taxonomic = input.required<number>()
  readonly num_nom = input.required<number>()


  taxonSearchService = inject(TaxonSearchService);

  constructor(private sanitizer: DomSanitizer) {}

  ngOnInit(): void {
    this.taxonSearchService.getTaxonFiche(this.referentiel(), this.num_nom())
  }

  renderMarkdown(md: string): SafeHtml {
    const html = marked.parse(md) as string;
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }
}
