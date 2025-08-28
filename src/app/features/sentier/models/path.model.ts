import {Position} from '../../../shared/models/position.model';

export type Path = {
  id: number;
  type: string;
  coordinates: Position[];
}
