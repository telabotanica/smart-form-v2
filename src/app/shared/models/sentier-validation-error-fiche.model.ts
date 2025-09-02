import {Taxon} from '../../features/taxon/models/taxon.model';

export type SentierValidationErrorFiche = {
  occurrence_id?: number;
  fiche_tag?: string;
  taxon?: Taxon;
  error?: string;
}
