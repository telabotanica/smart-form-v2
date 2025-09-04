import {StartEnd} from './start-end.model';
import {Path} from './path.model';
import {Occurrence} from '../../occurrence/models/occurrence.model';
import {Image} from '../../image/models/image.model';

export type Sentier = {
  id: number;
  display_name?: string;
  path?: Path;
  name?: string;
  author_id?: string;
  author?: string;
  author_email?: string;
  status?: string;
  position?: StartEnd;
  path_length?: number;
  occurrences_count?: number;
  details?: string;
  prm?: -1 | 0 | 1;
  best_season?: [boolean, boolean, boolean, boolean];
  date_creation?: string;
  date_modification?: string;
  date_suppression?: string;
  date_publication?: string;
  nb_taxons?: number;
  occurrences?: Occurrence[];
  image?: Image;
  ancien_id?: number;
}
