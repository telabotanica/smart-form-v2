import { inject, Injectable } from '@angular/core';
import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';
import { Taxon } from '../../../features/taxon/models/taxon.model';
import { Fiche } from '../../../features/fiche/models/fiche.model';
import { Sentier } from '../../../features/sentier/models/sentier.model';
import { SharedService } from '../../services/shared.service';
import {Tab, TabSection} from '../../../features/fiche/models/tabs.model';

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
  private sentier = {} as Sentier

  async generateTaxonFichePdf(
    taxon: Taxon,
    fiche: Fiche | null,
    imageUrl: string | null
  ): Promise<void> {
    const doc = new jsPDF('p', 'mm', 'a4');
    const dateStr = new Date().toISOString().split('T')[0];
    const fileName = `fiche-${this.sanitizeFileName(taxon.scientific_name)}-${dateStr}.pdf`;

    let y = this.topMargin;
    y = await this.renderLogoAndQrCode(doc, taxon, y, 'taxon');
    y = await this.renderColoredBanner(doc, taxon, imageUrl, y);

    if (fiche) {
      y = this.renderSection(doc, 'Description', fiche.description, y);
      y = this.renderSection(doc, 'Usages', fiche.usages, y);
      y = this.renderSection(doc, 'Écologie', fiche.ecologie, y);
      this.renderSection(doc, 'Sources', fiche.sources, y);
    }

    this.renderFooter(doc);
    doc.save(fileName);
  }

  async generateTrailPdf(
    sentier: Sentier,
    mapImageUrl: string | null,
    taxons: Taxon[] = []
  ): Promise<void> {
    this.sentier = sentier;
    const doc = new jsPDF('p', 'mm', 'a4');
    const dateStr = new Date().toISOString().split('T')[0];
    const fileName = `sentier-${this.sanitizeFileName(sentier.display_name || 'sentier')}-${dateStr}.pdf`;

    // Page 1: Trail information
    let y = this.topMargin;
    y = await this.renderTrailHeader(doc, sentier, y, mapImageUrl);
    y = this.renderTrailDetails(doc, sentier, y);
    await this.renderTrailTaxaList(doc, taxons, y);

    // Following pages: Taxa fiches
    if (taxons.length > 0) {
      for (const taxon of taxons) {
        doc.addPage();
        await this.renderTaxonFichePage(doc, taxon);
      }
    }

    this.renderFooter(doc);
    doc.save(fileName);
  }

  private async renderLogoAndQrCode(
    doc: jsPDF,
    data: Taxon | Sentier,
    startY: number,
    type: 'taxon' | 'sentier'
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
      // Continue without logo
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
    const startX = (this.margin *2) + logoWidth
    const startYSf = startY + (logoHeight / 2) + (titleHeight/2)

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(16);
    doc.setTextColor(...this.colors.accent);
    doc.text('Smart\'Flore', startX, startYSf);

    // Generate and render QR code directly
    try {
      let qrCodeDataUrl: string;
      if (type === 'taxon') {
        qrCodeDataUrl = await this.generateTaxonQrCodeDataUrl(data as Taxon);
      } else {
        qrCodeDataUrl = await this.generateSentierQrCodeDataUrl(data as Sentier);
      }
      const qrX = this.pageWidth - this.margin - qrSize;
      doc.addImage(qrCodeDataUrl, 'PNG', qrX, startY, qrSize, qrSize);
    } catch {
      // Continue without QR code
    }

    return startY + Math.max(logoHeight, qrSize) + 5;
  }

  private async generateTaxonQrCodeDataUrl(taxon: Taxon): Promise<string> {
    const baseUrl = this.sharedService.url().origin;
    const url = `${baseUrl}/fiche/${taxon.taxon_repository}/${taxon.taxonomic_id}/${taxon.name_id}`;
    return QRCode.toDataURL(url, {
      width: 200,
      margin: 1,
      color: { dark: '#000000', light: '#FFFFFF' },
    });
  }

  private async generateSentierQrCodeDataUrl(sentier: Sentier): Promise<string> {
    const baseUrl = this.sharedService.url().origin;
    const url = `${baseUrl}/trail/${sentier.id}`;
    return QRCode.toDataURL(url, {
      width: 200,
      margin: 1,
      color: { dark: '#000000', light: '#FFFFFF' },
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
    const textStartX = hasImage ? this.margin + imageWidth + 5 : this.margin;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);

    const vernacularHeight = 7;
    const scientificNameHeight = 7;

    const totalTextHeight = scientificNameHeight + vernacularHeight + 5;
    const bannerHeight = Math.max(25, totalTextHeight + 10);

    doc.setFillColor(...this.colors.primary);
    doc.rect(0, startY, this.pageWidth, bannerHeight, 'F');

    const textCenterY = startY + bannerHeight / 2;

    if (hasImage && imageUrl) {
      try {
        const img = await this.loadImage(imageUrl);
        let imgW = img.width;
        let imgH = img.height;
        const maxW = imageWidth;
        const maxH = imageHeight;

        if (imgW > maxW) {
          imgH = (imgH * maxW) / imgW;
          imgW = maxW;
        }
        if (imgH > maxH) {
          imgW = (imgW * maxH) / imgH;
          imgH = maxH;
        }

        const imgY = textCenterY - imgH / 2;
        const imgX = this.margin;
        doc.addImage(imageUrl, 'JPEG', imgX, imgY, imgW, imgH);
      } catch {
        // Continue without image
      }
    }

    if (taxon.vernacular_names && taxon.vernacular_names.length > 0) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.setTextColor(...this.colors.white);
      const nameY = textCenterY - totalTextHeight / 2 + 7;
      doc.text(taxon.vernacular_names[0], textStartX, nameY);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      doc.setTextColor(...this.colors.white);
      const text = `${taxon.scientific_name} famille des ${taxon.family}`
      doc.text(text, textStartX, nameY + 6);
    } else {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.setTextColor(...this.colors.white);
      const nameY = textCenterY - totalTextHeight / 2 + 7;
      doc.text(taxon.scientific_name, textStartX, nameY);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      doc.setTextColor(...this.colors.white);
      doc.text(`Famille des ${taxon.family}`, textStartX, nameY + 6);
    }

    return startY + bannerHeight + 10;
  }

  private async renderTrailHeader(
    doc: jsPDF,
    sentier: Sentier,
    startY: number,
    mapImageUrl: string | null
  ): Promise<number> {
    const logoHeight = 20;
    const logoRatio = 500 / 204;
    const logoWidth = logoHeight * logoRatio;
    const qrSize = 25;

    // Logo
    try {
      const logoUrl = 'assets/images/tela-botanica.webp';
      await this.loadImage(logoUrl);
      doc.addImage(logoUrl, 'WEBP', this.margin, startY, logoWidth, logoHeight);
    } catch {
      // Continue without logo
    }

    const titleHeight = 10;
    const startX = (this.margin *2) + logoWidth
    const startYSf = startY + (logoHeight / 2) + (titleHeight/2)

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(16);
    doc.setTextColor(...this.colors.accent);
    doc.text("Smart'Flore", startX, startYSf);

    // QR Code
    try {
      const qrCodeDataUrl = await this.generateSentierQrCodeDataUrl(sentier);
      const qrX = this.pageWidth - this.margin - qrSize;
      doc.addImage(qrCodeDataUrl, 'PNG', qrX, startY, qrSize, qrSize);
    } catch {
      // Continue without QR code
    }

    let y = startY + Math.max(logoHeight, qrSize) + 8;

    // Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.setTextColor(...this.colors.text);
    const displayName = sentier.display_name || sentier.name || 'Sentier sans nom';
    doc.text(displayName, this.margin, y);
    y += 12;

    // Map image if available
    /*
    if (mapImageUrl) {
      try {
        const mapImg = await this.loadImage(mapImageUrl);
        const maxWidth = this.contentWidth;
        const maxHeight = 60;

        let imgW = mapImg.width;
        let imgH = mapImg.height;

        if (imgW > maxWidth) {
          imgH = (imgH * maxWidth) / imgW;
          imgW = maxWidth;
        }
        if (imgH > maxHeight) {
          imgW = (imgW * maxHeight) / imgH;
          imgH = maxHeight;
        }

        const x = (this.pageWidth - imgW) / 2;
        doc.addImage(mapImageUrl, 'PNG', x, y, imgW, imgH);
        y += imgH + 8;
      } catch {
        // Continue without map
      }
    }
    */
    return y;
  }

  private renderTrailDetails(doc: jsPDF, sentier: Sentier, startY: number): number {
    let y = startY;
    const lineHeight = 6;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(...this.colors.text);

    // Author
    if (sentier.author) {
      doc.text(`Auteur: ${sentier.author}`, this.margin, y);
      y += lineHeight;
    }

    // Creation date
    if (sentier.date_creation) {
      const date = new Date(sentier.date_creation).toLocaleDateString('fr-FR');
      doc.text(`Créé le: ${date}`, this.margin, y);
      y += lineHeight;
    }

    // PMR Accessibility
    const pmrText = this.getPmrText(sentier.prm);
    doc.text(`Accessibilité PMR: ${pmrText}`, this.margin, y);
    y += lineHeight;

    // Best seasons
    const seasonsText = this.getSeasonsText(sentier.best_season);
    doc.text(`Meilleures saisons: ${seasonsText}`, this.margin, y);
    y += lineHeight + 2;

    // Stats
    doc.setFont('helvetica', 'bold');
    const length = sentier.path_length ? `${(sentier.path_length / 1000).toFixed(2)} km` : 'Non défini';
    const occurrences = sentier.occurrences_count || 0;
    const taxons = sentier.nb_taxons || 0;

    doc.text(`Longueur: ${length}`, this.margin, y);
    y += lineHeight;
    doc.text(`Nombre d'occurrences: ${occurrences}`, this.margin, y);
    y += lineHeight;
    doc.text(`Nombre de taxons: ${taxons}`, this.margin, y);
    y += lineHeight + 4;

    // Separator
    doc.setDrawColor(...this.colors.primary);
    doc.setLineWidth(0.5);
    doc.line(this.margin, y, this.pageWidth - this.margin, y);
    y += 8;

    return y;
  }

  public getPmrText(prm: number | undefined): string {
    switch (prm) {
      case -1: return 'Information non disponible';
      case 0: return 'Non accessible PMR';
      case 1: return 'Accessible PMR';
      default: return 'Information non disponible';
    }
  }

  private getSeasonsText(seasons: [boolean, boolean, boolean, boolean] | undefined): string {
    if (!seasons || seasons.every(s => !s)) {
      return 'Information non disponible';
    }

    const seasonNames = ['Printemps', 'Été', 'Automne', 'Hiver'];
    const activeSeasons = seasonNames.filter((_, index) => seasons[index]);
    return activeSeasons.join(', ');
  }

  private async renderTrailTaxaList(
    doc: jsPDF,
    taxons: Taxon[],
    startY: number
  ): Promise<number> {
    let y = startY;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(...this.colors.accent);
    doc.text('TAXONS DU SENTIER', this.margin, y);
    y += 8;

    if (taxons.length === 0) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      doc.setTextColor(...this.colors.gray);
      doc.text('Aucun taxon associé à ce sentier', this.margin, y);
      return y + 6;
    }

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(...this.colors.text);

    const lineHeight = 5;

    for (let i = 0; i < taxons.length; i++) {
      const taxon = taxons[i];
      const label = taxon.vernacular_names?.length
        ? `${i + 1}. ${taxon.vernacular_names[0]}`
        : `${i + 1}. ${taxon.scientific_name}`;

      const splitText = doc.splitTextToSize(label, this.contentWidth);

      if (y + splitText.length * lineHeight > this.pageHeight - this.margin - 20) {
        doc.addPage();
        y = this.margin;
      }

      doc.text(splitText, this.margin, y);
      y += splitText.length * lineHeight + 2;
    }

    return y;
  }

  private async renderTaxonFichePage(doc: jsPDF, taxon: Taxon): Promise<void> {
    let fiche: Tab | undefined = {} as Tab;
    if (taxon.tabs){
      fiche = taxon.tabs.find((tab: Tab) => tab.title === "Fiche Smart’Flore");
    }

    // Get image URL from taxonDetails if available
    let imageUrl: string | null = null;
    if (taxon.tabs) {
      const galleryTab = taxon.tabs.find((tab: Tab) => tab.type === 'gallery');
      if (galleryTab?.images && galleryTab.images.length > 0) {
        imageUrl = galleryTab.images[0].url;
      }
    }

    let y = this.topMargin;
    y = await this.renderLogoAndQrCodeForTaxonPage(doc, taxon, y);
    y = await this.renderColoredBannerForTaxonPage(doc, taxon, imageUrl, y);

    if (fiche?.sections) {
      const description = fiche.sections.find(
        (section: TabSection) => section.title?.trim().toLowerCase() === 'description'
      );

      const usages = fiche.sections.find(
        (section: TabSection) => section.title?.trim().toLowerCase() === 'usages'
      );

      const ecologie = fiche.sections.find(
        (section: TabSection) => section.title?.trim().toLowerCase() === 'ecologie'
      );

      const sources = fiche.sections.find(
        (section: TabSection) => section.title?.trim().toLowerCase() === 'sources'
      );

      y = this.renderSection(doc, 'Description', description?.text, y);
      y = this.renderSection(doc, 'Usages', usages?.text, y);
      y = this.renderSection(doc, 'Écologie', ecologie?.text, y);
      this.renderSection(doc, 'Sources', sources?.text, y);
    } else {
      // Show minimal info if no fiche
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(11);
      doc.setTextColor(...this.colors.gray);
      doc.text('Aucune fiche détaillée disponible pour ce taxon.', this.margin, y+50);
    }
  }

  private async renderLogoAndQrCodeForTaxonPage(doc: jsPDF, taxon: Taxon, startY: number): Promise<number> {
    const logoHeight = 15;
    const logoRatio = 500 / 204;
    const logoWidth = logoHeight * logoRatio;
    const qrSize = 20;

    try {
      const logoUrl = 'assets/images/tela-botanica.webp';
      await this.loadImage(logoUrl);
      doc.addImage(logoUrl, 'WEBP', this.margin, startY, logoWidth, logoHeight);
    } catch {
      // Continue without logo
    }

    const titleHeight = 10;
    const startX = (this.margin *2) + logoWidth
    const startYSf = startY + (logoHeight / 2) + (titleHeight/2)

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(16);
    doc.setTextColor(...this.colors.accent);
    doc.text(this.sentier.display_name ?? "Smart'Flore", startX, startYSf);

    try {
      const qrCodeDataUrl = await this.generateTaxonQrCodeDataUrl(taxon);
      const qrX = this.pageWidth - this.margin - qrSize;
      doc.addImage(qrCodeDataUrl, 'PNG', qrX, startY, qrSize, qrSize);
    } catch {
      // Continue without QR code
    }

    return startY + Math.max(logoHeight, qrSize) + 5;
  }

  private async renderColoredBannerForTaxonPage(
    doc: jsPDF,
    taxon: Taxon,
    imageUrl: string | null,
    startY: number
  ): Promise<number> {
    const hasImage = !!imageUrl;
    const imageWidth = 40;
    const imageHeight = 45;
    const textStartX = hasImage ? this.margin + imageWidth + 5 : this.margin;
    const textMaxWidth = this.pageWidth - textStartX - this.margin;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    const scientificNameHeight = 6;

    let vernacularHeight = 0;
    let vernacularLines: string[] = [];
    if (taxon.vernacular_names && taxon.vernacular_names.length > 0) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      const vernacularText = taxon.vernacular_names.join(', ');
      vernacularLines = doc.splitTextToSize(vernacularText, textMaxWidth);
      vernacularHeight = vernacularLines.length * 4 + 2;
    }

    const totalTextHeight = scientificNameHeight + vernacularHeight + 3;
    const bannerHeight = Math.max(20, totalTextHeight + 8);

    doc.setFillColor(...this.colors.primary);
    doc.rect(0, startY, this.pageWidth, bannerHeight, 'F');

    const textCenterY = startY + bannerHeight / 2;

    if (hasImage && imageUrl) {
      try {
        const img = await this.loadImage(imageUrl);
        let imgW = img.width;
        let imgH = img.height;
        const maxW = imageWidth;
        const maxH = imageHeight;

        if (imgW > maxW) {
          imgH = (imgH * maxW) / imgW;
          imgW = maxW;
        }
        if (imgH > maxH) {
          imgW = (imgW * maxH) / imgH;
          imgH = maxH;
        }

        const imgY = textCenterY - imgH / 2;
        const imgX = this.margin;
        doc.addImage(imageUrl, 'JPEG', imgX, imgY, imgW, imgH);
      } catch {
        // Continue without image
      }
    }

    if (taxon.vernacular_names && taxon.vernacular_names.length > 0) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.setTextColor(...this.colors.white);
      const nameY = textCenterY - totalTextHeight / 2 + 5;
      doc.text(taxon.vernacular_names[0], textStartX, nameY);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(...this.colors.white);

      const text = `${taxon.scientific_name} famille des ${taxon.family}`
      doc.text(text, textStartX, nameY + 6);
    } else {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.setTextColor(...this.colors.white);
      const nameY = textCenterY - totalTextHeight / 2 + 5;
      doc.text(taxon.scientific_name, textStartX, nameY);

      doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(...this.colors.white);
        doc.text(`Famille des ${taxon.family}`, textStartX, nameY + 6);
    }

    return startY + bannerHeight + 8;
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

    if (startY + titleHeight + contentHeight + sectionSpacing > this.pageHeight - this.margin) {
      doc.addPage();
      startY = this.margin;

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

  // Helper method to get first image URL from taxon
  getFirstImageUrl(taxon: Taxon): string | null {
    if (!taxon?.tabs) {
      return null;
    }

    const galleryTab = taxon.tabs.find((tab: Tab) => tab.type === 'gallery');
    if (galleryTab?.images && galleryTab.images.length > 0) {
      return galleryTab.images[0].url;
    }

    return null;
  }
}
