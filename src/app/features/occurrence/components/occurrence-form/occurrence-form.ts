import {
  ChangeDetectionStrategy,
  Component,
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
import {Occurrence} from '../../models/occurrence.model';
import {Taxon} from '../../../taxon/models/taxon.model';
import {ErrorComponent} from '../../../../shared/components/error/error';
import {TaxonSearch} from '../../../../shared/components/taxon-search/taxon-search';

@Component({
  selector: 'app-occurrence-form',
  imports: [ReactiveFormsModule, ErrorComponent, TaxonSearch],
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
    anecdotes: this.fb.control(''),
    retour: this.fb.control('min', { validators: [Validators.required] }),
    limite: this.fb.control(10, { validators: [Validators.required] }),
  }))

  // State signals
  readonly selectedTaxonName = signal<string>('');
  readonly selectedTaxonDetails = signal<Taxon>({} as Taxon);
  readonly newOccurrence = signal<Occurrence>({} as Occurrence)

  private debounceTimer?: number;

  ngOnInit(): void {
    const o = this.occurrence();
    if (o) {
      this.form().patchValue({
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
  resetSelection(): void {
    this.selectedTaxonName.set('');
  }

  fillOccurrence(taxon: Taxon): void {
    this.selectedTaxonName.set(taxon.scientific_name);
    this.newOccurrence.set({
      position: this.position(),
      taxon: taxon
    });
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

  @HostListener('window:keydown', ['$event'])
  onEscape(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      this.close();
    }
  }
}
