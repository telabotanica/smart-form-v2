import {Occurrence} from '../../occurrence/models/occurrence.model';

export interface Image {
  id: number;
  url?: string;
  author?: string;
  occurrence?: Occurrence
  cel_image_id?: number;
  mini?: string;
}
