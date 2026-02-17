import { inject, Injectable } from '@angular/core';
import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';
import { Taxon } from '../../../features/taxon/models/taxon.model';
import { Fiche } from '../../../features/fiche/models/fiche.model';
import { SharedService } from '../../services/shared.service';

type PdfColors = {
  primary: [number, number, number];
  accent: [number, number, number];
  text: [number, number, number];
  white: [number, number, number];
  gray: [number, number, number];
  lightGray: [number, number, number];
};

@Injectable({
  providedIn: 'root',
})
export class PdfExportService {
  private sharedService = inject(SharedService);

  private readonly colors: PdfColors = {
    primary: [255, 116, 105],
    accent: [5, 46, 61],
    text: [23, 29, 38],
    white: [255, 255, 255],
    gray: [128, 128, 128],
    lightGray: [230, 230, 230],
  };

  private readonly pageWidth = 210;
  private readonly pageHeight = 297;
  private readonly margin = 20;
  private readonly contentWidth = 170;
  private readonly topMargin = 5;

  async generateTaxonFichePdf(
    taxon: Taxon,
    fiche: Fiche | null,
    imageUrl: string | null
  ): Promise<void> {
    const doc = new jsPDF('p', 'mm', 'a4');
    const dateStr = new Date().toISOString().split('T')[0];
    const fileName = `fiche-${this.sanitizeFileName(taxon.scientific_name)}-${dateStr}.pdf`;

    let y = this.topMargin;

    // Step 1: Logo and QR code at the top (5mm margin)
    y = await this.renderLogoAndQrCode(doc, taxon, y);

    // Step 2: Colored banner with image + text (image overflows by 5mm)
    y = await this.renderColoredBanner(doc, taxon, imageUrl, y);

    // Step 3: Content sections
    if (fiche) {
      y = this.renderSection(doc, 'Description', fiche.description, y);
      y = this.renderSection(doc, 'Usages', fiche.usages, y-12);
      y = this.renderSection(doc, 'Écologie', fiche.ecologie, y-5);
      this.renderSection(doc, 'Sources', fiche.sources, y);
    }

    this.renderFooter(doc);

    doc.save(fileName);
  }

  private async renderLogoAndQrCode(
    doc: jsPDF,
    taxon: Taxon,
    startY: number
  ): Promise<number> {
    const logoHeight = 20;
    const logoRatio = 500 / 204;
    const logoWidth = logoHeight * logoRatio;
    const qrSize = 25;

    // Render logo
    try {
      const logoUrl = 'assets/images/tela-botanica.webp';
      await this.loadImage(logoUrl);
      doc.addImage(logoUrl, 'WEBP', this.margin, startY, logoWidth, logoHeight);
    } catch {
      // Logo non chargé, on continue sans
    }

    //Ajout logo Smart'Flore
    // try {
    //   const logoSfUrl = 'assets/images/logo_smartflore.png';
    //   await this.loadImage(logoSfUrl);
    //   const logoSfRatio = 200 / 200;
    //   const logoSfWidth = logoHeight * logoSfRatio;
    //   const qrXSf = (this.margin *2) + logoWidth
    //   doc.addImage(logoSfUrl, 'PNG', qrXSf, startY, logoSfWidth, logoHeight);
    // } catch {
    //   // Logo non chargé, on continue sans
    // }
    const titleHeight = 10;
    const lineHeight = 5;
    const sectionSpacing = 8;
    const startX = (this.margin *2) + logoWidth
    const startYSf = startY + (logoHeight / 2) + (titleHeight/2)

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(16);
    doc.setTextColor(...this.colors.accent);
    doc.text('Smart\'Flore', startX, startYSf);


    // Generate and render QR code directly
    try {
      const qrCodeDataUrl = await this.generateQrCodeDataUrl(taxon);
      const qrX = this.pageWidth - this.margin - qrSize;
      doc.addImage(qrCodeDataUrl, 'PNG', qrX, startY, qrSize, qrSize);
    } catch {
      // QR code non généré, on continue sans
    }

    return startY + Math.max(logoHeight, qrSize) + 5;
  }

  private async generateQrCodeDataUrl(taxon: Taxon): Promise<string> {
    const baseUrl = this.sharedService.url().origin;
    const url = `${baseUrl}/fiche/${taxon.taxon_repository}/${taxon.taxonomic_id}/${taxon.name_id}`;

    return QRCode.toDataURL(url, {
      width: 200,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    });
  }

  private async renderColoredBanner(
    doc: jsPDF,
    taxon: Taxon,
    imageUrl: string | null,
    startY: number
  ): Promise<number> {
    const hasImage = !!imageUrl;
    const imageWidth = 45;
    const imageHeight = 50;
    const imageOverflow = 5;
    const textStartX = hasImage ? this.margin + imageWidth + 5 : this.margin;
    const textMaxWidth = this.pageWidth - textStartX - this.margin;

    // Calculate text height needed
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    const scientificNameHeight = 7;

    let vernacularHeight = 0;
    let vernacularLines: string[] = [];
    if (taxon.vernacular_names && taxon.vernacular_names.length > 0) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      const vernacularText = taxon.vernacular_names.join(', ');
      vernacularLines = doc.splitTextToSize(vernacularText, textMaxWidth);
      vernacularHeight = vernacularLines.length * 5 + 3;
    }

    const totalTextHeight = scientificNameHeight + vernacularHeight + 5;
    // Banner height is just enough for text + small padding (10mm total)
    const bannerHeight = Math.max(25, totalTextHeight + 10);

    // Draw colored background (full width)
    doc.setFillColor(...this.colors.primary);
    doc.rect(0, startY, this.pageWidth, bannerHeight, 'F');

    // Calculate vertical center of text
    const textCenterY = startY + bannerHeight / 2;

    // Render image if available (centered vertically on text, overflows by 5mm)
    if (hasImage && imageUrl) {
      try {
        const img = await this.loadImage(imageUrl);
        let imgW = img.width;
        let imgH = img.height;
        const maxW = imageWidth;
        const maxH = imageHeight;

        // Scale maintaining aspect ratio
        if (imgW > maxW) {
          imgH = (imgH * maxW) / imgW;
          imgW = maxW;
        }
        if (imgH > maxH) {
          imgW = (imgW * maxH) / imgH;
          imgH = maxH;
        }

        // Position image to be centered vertically on text
        // Image overflows by 5mm above and below the banner
        const imgY = textCenterY - imgH / 2;
        const imgX = this.margin;
        doc.addImage(imageUrl, 'JPEG', imgX, imgY, imgW, imgH);
      } catch {
        // Image non chargée, on continue sans
      }
    }

    // Render scientific name (vertically centered)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(...this.colors.white);
    const nameY = textCenterY - totalTextHeight / 2 + 7;
    doc.text(taxon.scientific_name, textStartX, nameY);

    // Render vernacular names
    if (vernacularLines.length > 0) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      doc.setTextColor(...this.colors.white);
      doc.text(vernacularLines, textStartX, nameY + 8);
    }

    return startY + bannerHeight + 10;
  }

  private renderSection(
    doc: jsPDF,
    title: string,
    content: string | undefined,
    startY: number
  ): number {
    if (!content || content.trim().length === 0) {
      return startY;
    }

    const titleHeight = 10;
    const lineHeight = 5;
    const sectionSpacing = 8;

    // Check if we need to add a page before the title
    if (startY + titleHeight + 20 > this.pageHeight - this.margin) {
      doc.addPage();
      startY = this.margin;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(...this.colors.accent);
    doc.text(title.toUpperCase(), this.margin, startY + titleHeight);

    doc.setDrawColor(...this.colors.primary);
    doc.setLineWidth(0.5);
    doc.line(
      this.margin,
      startY + titleHeight + 2,
      this.margin + 50,
      startY + titleHeight + 2
    );

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(...this.colors.text);

    const splitContent = doc.splitTextToSize(content, this.contentWidth);
    const contentHeight = splitContent.length * lineHeight;

    // Check if content fits on current page, if not add new page
    if (
      startY + titleHeight + contentHeight + sectionSpacing >
      this.pageHeight - this.margin
    ) {
      doc.addPage();
      startY = this.margin;

      // Redraw title on new page
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(...this.colors.accent);
      doc.text(title.toUpperCase(), this.margin, startY + titleHeight);

      doc.setDrawColor(...this.colors.primary);
      doc.line(
        this.margin,
        startY + titleHeight + 2,
        this.margin + 50,
        startY + titleHeight + 2
      );

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(...this.colors.text);
    }

    doc.text(splitContent, this.margin, startY + titleHeight + sectionSpacing);

    return startY + titleHeight + contentHeight + sectionSpacing;
  }

  private renderFooter(doc: jsPDF): void {
    const footerY = this.pageHeight - 10;
    const dateStr = new Date().toLocaleDateString('fr-FR');
    const footerText = `Généré le ${dateStr} • Smart'Flore par Tela Botanica`;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...this.colors.gray);

    const textWidth = doc.getTextWidth(footerText);
    const x = (this.pageWidth - textWidth) / 2;

    doc.setDrawColor(...this.colors.lightGray);
    doc.setLineWidth(0.3);
    doc.line(this.margin, footerY - 5, this.pageWidth - this.margin, footerY - 5);

    doc.text(footerText, x, footerY);
  }

  private loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = (): void => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  }

  private sanitizeFileName(name: string): string {
    return name.replace(/[^a-z0-9]/gi, '-').toLowerCase();
  }
}
