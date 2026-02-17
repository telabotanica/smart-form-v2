import {ChangeDetectionStrategy, Component, inject, input, signal} from '@angular/core';
import {Taxon} from '../../../features/taxon/models/taxon.model';
import {Fiche} from '../../../features/fiche/models/fiche.model';
import {PdfExportService} from './pdf-export.service';

@Component({
  selector: 'app-pdf-export',
  imports: [],
  templateUrl: './pdf-export.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PdfExport {
  readonly taxon = input<Taxon | null>(null);
  readonly fiche = input<Fiche | null>(null);
  readonly imageUrl = input<string | null>(null);

  private pdfExportService = inject(PdfExportService);
  readonly isGenerating = signal(false);

  async exportToPdf(): Promise<void> {
    const taxon = this.taxon();
    if (!taxon) {
      return;
    }

    this.isGenerating.set(true);

    try {
      await this.pdfExportService.generateTaxonFichePdf(
        taxon,
        this.fiche(),
        this.imageUrl()
      );
    } finally {
      this.isGenerating.set(false);
    }
  }
}
