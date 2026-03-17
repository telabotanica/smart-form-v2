import {ChangeDetectionStrategy, Component, input, signal} from '@angular/core';
import {SentierValidationError} from '../../../../shared/models/sentier-validation-error.model';
import {SentierValidationErrorFiche} from '../../../../shared/models/sentier-validation-error-fiche.model';
import {SentierValidationCheck} from '../../models/sentier-validation-check.model';

@Component({
  selector: 'app-sentier-check-errors',
  imports: [],
  templateUrl: './sentier-check-errors.html',
  styleUrl: './sentier-check-errors.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SentierCheckErrors {
  readonly check = input<SentierValidationCheck | null>()
  readonly error = input<SentierValidationError | null>();
  readonly fichesIncompletes = signal<SentierValidationErrorFiche[]>([]);

  constructor() {
    this.fichesIncompletes.set(this.error()?.fiches_incompletes ?? []);
  }

}
