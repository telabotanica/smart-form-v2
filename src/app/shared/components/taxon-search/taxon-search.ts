import {ChangeDetectionStrategy, Component, effect, HostListener, inject, output, signal} from '@angular/core';
import {TaxonSearchService} from '../../../features/taxon/services/taxon-search-service';
import {FormBuilder, ReactiveFormsModule, Validators} from '@angular/forms';
import {toSignal} from '@angular/core/rxjs-interop';
import {Taxon} from '../../../features/taxon/models/taxon.model';
import {ErrorComponent} from '../error/error';
import {Loader} from '../loader/loader';

@Component({
  selector: 'app-taxon-search',
  imports: [
    ErrorComponent,
    ReactiveFormsModule,
    Loader
  ],
  templateUrl: './taxon-search.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TaxonSearch {
  readonly emitTaxon = output<Taxon>()

  taxonSearchService = inject(TaxonSearchService);
  private fb = inject(FormBuilder);

  readonly form = signal(this.fb.group({
    referentiel: this.fb.control('bdtfx', { validators: [Validators.required] }),
    nom_verna: this.fb.control(false),
    recherche: this.fb.control('', { validators: [Validators.required] }),
    anecdotes: this.fb.control(''),
    retour: this.fb.control('min', { validators: [Validators.required] }),
    limite: this.fb.control(10, { validators: [Validators.required] }),
  }))

  readonly referentielSignal = toSignal(
    this.form().get('referentiel')!.valueChanges,
    { initialValue: this.form().get('referentiel')!.value }
  );

  readonly nomVernaSignal = toSignal(
    this.form().get('nom_verna')!.valueChanges,
    { initialValue: this.form().get('nom_verna')!.value }
  );

  readonly quickSearchValue = signal('');
  readonly showQuickSearchResults = signal(false)
  readonly selectedTaxonName = signal<string>('');
  readonly selectedTaxonDetails = signal<Taxon>({} as Taxon);

  private debounceTimer?: number;

  constructor() {
    effect(() => {
      const ref = this.referentielSignal();
      if (!ref) { return; }

      this.form().patchValue({ recherche: '' });
      this.selectedTaxonName.set('');
      this.quickSearchValue.set('');
      this.showQuickSearchResults.set(false);
    });

    effect(() => {
      const verna = this.nomVernaSignal();
      if (verna === null || verna === undefined) { return };

      this.form().patchValue({ recherche: '' });
      this.selectedTaxonName.set('');
      this.quickSearchValue.set('');
      this.showQuickSearchResults.set(false);
    });
  }

  onInputChange(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    this.debounceTimer = window.setTimeout(() => {
      this.selectedTaxonName.set('');
      this.searchTaxonsNames()
    }, 300);
  }

  async searchTaxonsNames(): Promise<void> {
    await this.taxonSearchService.quickSearchTaxons(this.form().value);
    this.showQuickSearchResults.set(true);
  }

  // Selection du taxon depuis la liste de recherche rapide
  async selectTaxonName(taxonName: string): Promise<void> {
    this.selectedTaxonName.set(taxonName);
    this.showQuickSearchResults.set(false);
    this.form().patchValue(
      {
        recherche:  this.selectedTaxonName()
      }
    )

    try {
      await this.getTaxonDetails()
        .then(() => {
        this.emitTaxon.emit(this.selectedTaxonDetails());
        })
        .catch((err) => {
        console.error(err)
        })
    } catch (error) { console.error(error); }

    // this.fillOccurrence()
  }

  async getTaxonDetails(): Promise<void> {
    await this.taxonSearchService.searchTaxons(this.form().value);
    const results = this.taxonSearchService.taxonsSearchResults()?.resultats ?? [];

    if (results.length === 0) {
      //TODO message d'erreur si pas de résultat
      // this.taxonSearchService.setError('Aucun taxon trouvé pour cette recherche.');
      return;
    }

    this.selectedTaxonDetails.set({
      name_id: results[0].num_nom,
      scientific_name: results[0].nom_sci,
      taxon_repository: results[0].referentiel,
      taxonomic_id: results[0].num_taxonomique,
      vernacular_names: results[0].noms_vernaculaires ?? []
    } as Taxon);
  }

  handleKey(event: KeyboardEvent): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.showQuickSearchResults.set(false);
    }
  }

  handleSelectName(event: KeyboardEvent, name:string): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.selectTaxonName(name)
    }
  }

  @HostListener('window:keydown', ['$event'])
  onEscape(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      this.showQuickSearchResults.set(false);
    }
  }
}
