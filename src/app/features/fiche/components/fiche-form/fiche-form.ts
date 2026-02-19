import {
  ChangeDetectionStrategy,
  Component,
  computed,
  HostListener,
  inject,
  input,
  OnInit,
  output
} from '@angular/core';
import {FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import {FicheService} from '../../services/fiche-service';
import {Fiche} from '../../models/fiche.model';
import {ErrorComponent} from '../../../../shared/components/error/error';

@Component({
  selector: 'app-fiche-form',
  imports: [
    FormsModule,
    ReactiveFormsModule,
    ErrorComponent
  ],
  templateUrl: './fiche-form.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FicheForm implements OnInit {
  readonly referentiel = input.required<string>();
  readonly taxonomic_id = input.required<number>();
  readonly fiche = input<Fiche | null>(null);

  readonly modalClosed = output<boolean>();
  readonly modalSucceed = output<boolean>();
  readonly ficheCreated = output<boolean>();

  private fb = inject(FormBuilder);
  ficheService = inject(FicheService);

  readonly form = computed(() => {
    const f = this.fiche();
    return new FormGroup({
      description: new FormControl(f?.description ?? '', Validators.required),
      usages:      new FormControl(f?.usages      ?? ''),
      ecologie:    new FormControl(f?.ecologie    ?? ''),
      sources:     new FormControl(f?.sources     ?? '', Validators.required),
    });
  });

  readonly formProgress = computed(() => {
    const f = this.form();
    const fields = ['description', 'usages', 'ecologie', 'sources'];
    const filled = fields.filter(k => f.get(k)?.value?.trim().length > 0).length;
    return (filled / fields.length) * 100;
  });

  submitted = false;

  ngOnInit(): void {
    const f = this.fiche();
    if (f) {
      this.form().patchValue({
        description: f.description ?? '',
        usages: f.usages ?? '',
        ecologie: f.ecologie ?? '',
        sources: f.sources ?? ''
      });
    }
  }

  async submit(): Promise<void> {
    this.submitted = true;
    if (!this.form().valid) {return;}

    const formValue = this.form().value;

    const ficheToSave: Fiche = {
      description: formValue.description ?? '',
      usages: formValue.usages ?? '',
      ecologie: formValue.ecologie ?? '',
      sources: formValue.sources ?? ''
    };

    try {
      if (this.fiche()) {
        await this.ficheService.updateFiche(this.referentiel(), this.taxonomic_id(), ficheToSave);
      } else {
        await this.ficheService.createFiche(this.referentiel(), this.taxonomic_id(), ficheToSave);
        //TODO: récupérer le tag de la fiche
      }

      if (!this.ficheService.errorUpdate()) {
        if (!this.fiche()) {
          this.ficheCreated.emit(true);
        }
        this.modalSucceed.emit(true);
        this.closeModal();
      }
    } catch (error) {
      console.error('Erreur lors de la soumission du formulaire de fiche :', error);
    }
  }

  closeModal(): void {
    this.modalClosed.emit(true);
  }

  handleKey(event: KeyboardEvent): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.closeModal();
    }
  }

  @HostListener('window:keydown', ['$event'])
  onEscape(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      this.closeModal();
    }
  }
}
