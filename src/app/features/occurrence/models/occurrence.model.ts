import {Position} from '../../../shared/models/position.model';
import {Taxon} from '../../taxon/models/taxon.model';
import {Sentier} from '../../sentier/models/sentier.model';

export interface Occurrence {
  id: number;
  sentier?: Sentier;
  card_tag?: string;
  position?: Position;
  anecdotes?: string;
  user_id?: string;
  date_suppression?: string;
  taxon?: Taxon;
  image_id?: number;
}
