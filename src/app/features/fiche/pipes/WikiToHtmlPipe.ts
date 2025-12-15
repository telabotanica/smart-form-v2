import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'wikiToHtml',
  standalone: true
})
export class WikiToHtmlPipe implements PipeTransform {
  transform(text: string): string {
    if (!text) { return '' };

    // Convertir les liens wiki [[url]] en balises <a>
    const linkRegex = /\[\[([^\]]+)\]\]/g;

    return text.replace(linkRegex, (match, url) => {
      const trimmedUrl = url.trim();
      // Extraire le nom de domaine pour l'affichage
      const displayText = this.extractDisplayText(trimmedUrl);
      return `<a href="${trimmedUrl}" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:underline">${displayText}</a>`;
    });
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
