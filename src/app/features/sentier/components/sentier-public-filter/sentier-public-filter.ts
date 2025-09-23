import {ChangeDetectionStrategy, Component, EventEmitter, Output, signal} from '@angular/core';

@Component({
  selector: 'app-sentier-public-filter',
  imports: [],
  templateUrl: './sentier-public-filter.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SentierPublicFilter {
  readonly nom = signal('');
  readonly auteur = signal('');
  readonly pmr = signal<number | null>(null);
  readonly ordre = signal<'ASC' | 'DESC'>('ASC');

  @Output() readonly searchFilters = new EventEmitter<{
    nom?: string;
    auteur?: string;
    pmr?: number;
    ordre?: 'ASC' | 'DESC';
  }>();

  private debounceTimer?: number;

  emitSearch(): void {
    this.searchFilters.emit({
      nom: this.nom() || undefined,
      auteur: this.auteur() || undefined,
      pmr: this.pmr() !== null ? this.pmr() as number : undefined,
      ordre: this.ordre(),
    });
  }

  submit(): void {
    this.emitSearch();
  }

  reset(): void {
    this.nom.set('');
    this.auteur.set('');
    this.pmr.set(null);
    this.ordre.set('ASC');
    // this.submit();
    this.emitSearch();
  }

  onPmrChange(event: Event): void {
    const value = Number((event.target as HTMLSelectElement).value);
    this.pmr.set(isNaN(value) ? null : value);
    this.emitSearch();
  }

  onInputChange(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    this.debounceTimer = window.setTimeout(() => {
      this.emitSearch();
    }, 500); // 500ms de délai avant d'émettre
  }

}
