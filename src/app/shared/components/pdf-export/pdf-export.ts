import {ChangeDetectionStrategy, Component, inject, input, output, signal} from '@angular/core';
import {Taxon} from '../../../features/taxon/models/taxon.model';
import {Fiche} from '../../../features/fiche/models/fiche.model';
import {Sentier} from '../../../features/sentier/models/sentier.model';
import {PdfExportService} from './pdf-export.service';

type ExportType = 'taxon' | 'sentier';

@Component({
  selector: 'app-pdf-export',
  imports: [],
  templateUrl: './pdf-export.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PdfExport {
  readonly type = input<ExportType>('taxon');
  readonly taxon = input<Taxon | null>(null);
  readonly fiche = input<Fiche | null>(null);
  readonly imageUrl = input<string | null>(null);
  readonly sentier = input<Sentier | null>(null);
  readonly mapImageUrl = input<string | null>(null);
  readonly isLoading = input<boolean>(false);
  readonly taxons = input<Taxon[]>([]);
  readonly beforeExport = output<void>();

  private pdfExportService = inject(PdfExportService);
  readonly isGenerating = signal(false);

  async exportToPdf(): Promise<void> {
    this.isGenerating.set(true);

    try {
      // Emit beforeExport event to allow parent to prepare (e.g., capture map)
      this.beforeExport.emit();

      // Delay to allow parent to process (e.g., capture map image with render)
      await new Promise(resolve => setTimeout(resolve, 500));

      if (this.type() === 'sentier') {
        const sentier = this.sentier();
        if (sentier) {
          await this.pdfExportService.generateTrailPdf(sentier, this.mapImageUrl(), this.taxons());
        }
      } else {
        const taxon = this.taxon();
        if (taxon) {
          await this.pdfExportService.generateTaxonFichePdf(
            taxon,
            this.fiche(),
            this.imageUrl()
          );
        }
      }
    } finally {
      this.isGenerating.set(false);
    }
  }
}
