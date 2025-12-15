import {inject, Pipe, PipeTransform} from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Pipe({
  name: 'wikiToHtml',
  standalone: true
})
export class WikiToHtmlPipe implements PipeTransform {
  private sanitizer = inject(DomSanitizer);

  transform(text: string): SafeHtml {
    if (!text) { return '' }

    let processedText = text;

    // 1. Convertir d'abord les liens wiki [[url]] en balises <a>
    const wikiLinkRegex = /\[\[([^\]]+)\]\]/g;
    processedText = processedText.replace(wikiLinkRegex, (match, url) => {
      const trimmedUrl = url.trim();
      const displayText = this.extractDisplayText(trimmedUrl);
      return `<a href="${trimmedUrl}" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:underline">${displayText}</a>`;
    });

    // 2. Convertir les URLs directes (http:// ou https://) qui ne sont pas déjà dans des balises <a>
    // On utilise un lookbehind négatif pour éviter de matcher les URLs déjà dans href=""
    const urlRegex = /(?<!href=["'])https?:\/\/[^\s<>"]+/gi;
    processedText = processedText.replace(urlRegex, (url) => {
      const displayText = this.extractDisplayText(url);
      return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:underline">${displayText}</a>`;
    });

    // Sanitize le HTML pour la sécurité
    return this.sanitizer.bypassSecurityTrustHtml(processedText);
  }

  private extractDisplayText(url: string): string {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.replace('www.', '');
    } catch {
      return url;
    }
  }
}
