import {Position} from '../../../shared/models/position.model';
import {Taxon} from '../../taxon/models/taxon.model';
import {Sentier} from '../../sentier/models/sentier.model';
import {Image} from '../../image/models/image.model';

/*
Pour ajouter une image on utilisera ou image_id ou images[] mais pas les 2
 */
export type Occurrence = {
  id?: number;
  sentier?: Sentier;
  card_tag?: string;
  position?: Position;
  anecdotes?: string | null;
  user_id?: string;
  date_suppression?: string;
  taxon?: Taxon;
  image_id?: number; //cel_image_id
  images?: Image[];
}
