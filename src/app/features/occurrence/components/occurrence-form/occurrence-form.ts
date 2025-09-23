import {
  ChangeDetectionStrategy,
  Component,
  effect,
  HostListener,
  inject,
  input,
  OnInit,
  output,
  signal
} from '@angular/core';
import {FormBuilder, ReactiveFormsModule, Validators} from '@angular/forms';
import { TaxonSearchService } from '../../../taxon/services/taxon-search-service';
import { OccurrenceService } from '../../services/occurrence-service';
import { Position } from '../../../../shared/models/position.model';
import { Sentier } from '../../../sentier/models/sentier.model';
import {toSignal} from '@angular/core/rxjs-interop';
import {Occurrence} from '../../models/occurrence.model';
import {Taxon} from '../../../taxon/models/taxon.model';
import {ErrorComponent} from '../../../../shared/components/error/error';

@Component({
  selector: 'app-occurrence-form',
  imports: [ReactiveFormsModule, ErrorComponent],
  templateUrl: './occurrence-form.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OccurrenceForm implements OnInit {
  readonly position = input.required<Position>();
  readonly sentier = input.required<Sentier>();
  readonly occurrence = input<Occurrence | null>(null);
  readonly modalClosed = output<boolean>();
  readonly modalSuccessed = output<boolean>();

  taxonSearchService = inject(TaxonSearchService);
  occurrenceService = inject(OccurrenceService);
  private fb = inject(FormBuilder);

  readonly quickSearchValue = signal('');
  readonly showQuickSearchResults = signal(false)

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

  // State signals
  readonly currentStep = signal(1);
  readonly selectedTaxonName = signal<string>('');
  readonly selectedTaxonDetails = signal<Taxon>({} as Taxon);
  readonly newOccurrence = signal<Occurrence>({} as Occurrence)

  private debounceTimer?: number;
  constructor() {
    // effect(() => {
    //   const ref = this.referentielSignal();
    //   const verna = this.nomVernaSignal();
    //   const recherche = this.form().get('recherche')!.value;
    //   // on évite d'effacer au premier run si le champ est déjà vide
    //   if (!ref || !recherche || !verna) {return;}
    //
    //   this.form().patchValue({ recherche: '' });
    //   this.selectedTaxonName.set('');
    //   this.quickSearchValue.set('')
    //   this.showQuickSearchResults.set(false);
    //   // this.newOccurrence.set({
    //   //   taxon: {} as Taxon
    //   // })
    //   console.log( this.selectedTaxonName())
    //   console.log( this.quickSearchValue())
    // });

    effect(() => {
      const ref = this.referentielSignal();
      if (!ref) { return };

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

  ngOnInit(): void {
    const o = this.occurrence();
    if (o) {
      this.form().patchValue({
        referentiel: o.taxon?.taxon_repository ?? 'bdtfx',
        nom_verna: o.taxon?.vernacular_names ? o.taxon.vernacular_names.length > 0 : false,
        recherche: o.taxon?.scientific_name ?? '',
        anecdotes: o.anecdotes ?? '',
        retour: 'min',
        limite: 10
      });
      this.selectedTaxonName.set(o.taxon?.scientific_name ?? '');
      this.quickSearchValue.set(o.taxon?.scientific_name ?? '')
      this.selectedTaxonDetails.set(o.taxon ?? {} as Taxon);
      this.newOccurrence.set(o)
    }
  }

// TODO: ajouter image
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

   await this.getTaxonDetails()
    //TODO: ajouter un loader
    this.fillOccurrence()
  }

  // Récupération du détail du taxon
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

  fillOccurrence(): void {
    this.newOccurrence.set({
      position: this.position(),
      taxon: this.selectedTaxonDetails()
    })
    //TODO: A supprimer après mise en place du loader
    console.log("occurrence prête à être envoyé")
  }

  async submit(): Promise<void> {
    this.newOccurrence.update(current => ({
      ...current,
      anecdotes: this.form().get('anecdotes')?.value ?? ''
    }));

    try {
      if (this.occurrence()) {
        await this.occurrenceService.updateOccurrence(this.newOccurrence());
      } else {
        //TODO: ajouter même condition si erreur
        if (!this.form().valid) { return; }
        await this.occurrenceService.addOccurrence(this.newOccurrence(), this.sentier());
      }

      if (!this.occurrenceService.error()) {
        this.modalSuccessed.emit(true);
        this.close()
      }
    } catch (error) {
      console.error('Error submitting occurrence:', error);
    }
  }

  close(): void {
    this.modalClosed.emit(true);
  }

  handleKey(event: KeyboardEvent): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.close();
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
      this.close();
    }
  }
}
