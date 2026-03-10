import {inject, Pipe, PipeTransform} from '@angular/core';
import {DomSanitizer, SafeHtml} from '@angular/platform-browser';

@Pipe({
  name: 'wikiToHtml',
})
export class WikiToHtmlPipe implements PipeTransform {
  private sanitizer = inject(DomSanitizer);

  transform(text: string): SafeHtml {
    if (!text) { return ''; }

    let t = text;

    // 1. Liens wiki [[url]] → <a>
    t = t.replace(/\[\[([^\]]+)\]\]/g, (_, url) => {
      const trimmed = url.trim();
      const label = this.extractDisplayText(trimmed);
      return `<a href="${trimmed}" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:underline">${label}</a>`;
    });

    // 2. URLs directes non encapsulées dans un href
    t = t.replace(/(?<!href=["'])https?:\/\/[^\s<>"]+/gi, (url) => {
      const label = this.extractDisplayText(url);
      return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:underline">${label}</a>`;
    });

    // --- Formatage inline ---
    // Ordre important : du plus long au plus court pour éviter les conflits

    // MediaWiki : bold+italic ''''' > bold ''' > italic ''
    t = t.replace(/'''''(.+?)'''''/g, '<strong><em>$1</em></strong>');
    t = t.replace(/'''(.+?)'''/g, '<strong>$1</strong>');
    t = t.replace(/''(.+?)''/g, '<em>$1</em>');

    // Syntaxe alternative : **gras** et //italique//
    t = t.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    t = t.replace(/\/\/(.+?)\/\//g, '<em>$1</em>');

    // Souligné __texte__
    t = t.replace(/__(.+?)__/g, '<u>$1</u>');

    // Barré ~~texte~~
    t = t.replace(/~~(.+?)~~/g, '<s>$1</s>');

    // Exposant ^texte^
    t = t.replace(/\^(.+?)\^/g, '<sup>$1</sup>');

    // Indice ,,texte,,
    t = t.replace(/,,(.+?),,/g, '<sub>$1</sub>');

    // Code inline `texte` ou {{{texte}}}
    t = t.replace(/`([^`]+)`/g, '<code class="bg-background-100 px-1 rounded text-sm font-mono">$1</code>');
    t = t.replace(/\{\{\{([^}]+)\}\}\}/g, '<code class="bg-background-100 px-1 rounded text-sm font-mono">$1</code>');

    // --- Titres de section (== Titre ==) ---
    t = t.replace(/^======\s*(.+?)\s*======\s*$/gm, '<h6 class="text-xs font-semibold text-text mt-3 mb-1">$1</h6>');
    t = t.replace(/^=====\s*(.+?)\s*=====\s*$/gm,  '<h5 class="text-sm font-semibold text-text mt-3 mb-1">$1</h5>');
    t = t.replace(/^====\s*(.+?)\s*====\s*$/gm,    '<h4 class="text-sm font-semibold text-text mt-4 mb-1">$1</h4>');
    t = t.replace(/^===\s*(.+?)\s*===\s*$/gm,      '<h3 class="text-base font-semibold text-text mt-4 mb-1">$1</h3>');
    t = t.replace(/^==\s*(.+?)\s*==\s*$/gm,        '<h2 class="text-lg font-semibold text-text mt-5 mb-2">$1</h2>');

    // --- Listes ---
    t = this.transformList(t, 'ul');
    t = this.transformList(t, 'ol');

    return this.sanitizer.bypassSecurityTrustHtml(t);
  }

  /**
   * Regroupe les lignes de liste consécutives en un bloc <ul> ou <ol>
   */
  private transformList(text: string, tag: 'ul' | 'ol'): string {
    const linePattern = tag === 'ul' ? /^\* (.+)$/ : /^# (.+)$/;
    const lines = text.split('\n');
    const result: string[] = [];
    let inList = false;

    for (const line of lines) {
      const match = line.match(linePattern);
      if (match) {
        if (!inList) {
          const cls = tag === 'ul' ? 'list-disc' : 'list-decimal';
          result.push(`<${tag} class="${cls} pl-5 text-sm text-text space-y-0.5">`);
          inList = true;
        }
        result.push(`<li>${match[1]}</li>`);
      } else {
        if (inList) {
          result.push(`</${tag}>`);
          inList = false;
        }
        result.push(line);
      }
    }

    if (inList) { result.push(`</${tag}>`); }

    return result.join('\n');
  }

  private extractDisplayText(url: string): string {
    try {
      return new URL(url).hostname.replace('www.', '');
    } catch {
      return url;
    }
  }
}
