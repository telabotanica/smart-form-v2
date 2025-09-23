import {ChangeDetectionStrategy, Component, HostListener, inject, input, OnInit, output, signal} from '@angular/core';
import {Sentier} from '../../models/sentier.model';
import {SharedService} from '../../../../shared/services/shared.service';
import {SingleSentierService} from '../../services/single-sentier-service';
import {FormArray, FormBuilder, FormControl, ReactiveFormsModule, Validators} from '@angular/forms';
import {CommonModule} from '@angular/common';
import {Router} from '@angular/router';

@Component({
  selector: 'app-sentier-form',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './sentier-form.html',
  styleUrl: './sentier-form.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SentierForm implements OnInit {
  readonly sentier = input<Sentier | null>(null);
  readonly modalClosed = output<boolean>()

  sharedService = inject(SharedService);
  sentierService= inject(SingleSentierService)
  private fb = inject(FormBuilder);
  private readonly router = inject(Router);

  readonly form = signal(this.fb.group({
    name: this.fb.control(''),
    display_name: this.fb.control('', { validators: [Validators.required] }),
    best_season: this.fb.array<FormControl<boolean>>([
      this.fb.control(false, { nonNullable: true }),
      this.fb.control(false, { nonNullable: true }),
      this.fb.control(false, { nonNullable: true }),
      this.fb.control(false, { nonNullable: true })
    ]),
    prm: this.fb.control<-1 | 0 | 1>(-1, { nonNullable: true })
  }))

  ngOnInit(): void {
    const s = this.sentier();
    if (s) {
      this.form().patchValue({
        name: s.display_name ?? "",
        display_name: s.display_name ?? "",
        prm: s.prm ?? -1
      });

      // pré-remplir les checkboxes une par une
      const bestSeasonsArray = this.form().get('best_season') as FormArray<FormControl<boolean>>;
      if (s.best_season) {
        s.best_season.forEach((val, i) => bestSeasonsArray.at(i).setValue(!!val));
      }
    }
  }

  async submit(): Promise<void> {
    if (!this.form().valid) {return;}

    const formValue = this.form().value;
    const bestSeasonTuple: [boolean, boolean, boolean, boolean] = [
      formValue.best_season?.[0] ?? false,
      formValue.best_season?.[1] ?? false,
      formValue.best_season?.[2] ?? false,
      formValue.best_season?.[3] ?? false
    ];

    const sentierPayload: Sentier = {
      id: this.sentier()?.id ?? 0,
      name: formValue.display_name ?? '',
      display_name: formValue.display_name ?? '',
      best_season: bestSeasonTuple,
      prm: formValue.prm as -1 | 0 | 1
    };

    if (this.sentier()) {
      await this.sentierService.updateSentier(sentierPayload);
    } else {
      const newSentier = await this.sentierService.addSentier(sentierPayload);
      if (newSentier) {
        await this.router.navigate(['/trail', newSentier.id]);
      }
    }
    this.closeModal()
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
