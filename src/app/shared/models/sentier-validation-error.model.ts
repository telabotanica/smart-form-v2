import {SentierValidationErrorFiche} from './sentier-validation-error-fiche.model';

export type SentierValidationError = {
  nb_occurrences?: string;
  localisation?: string;
  path?: string;
  occurrences_localisation?: string;
  fiches_incompletes?:[SentierValidationErrorFiche]
}
