import {Position} from '../../../shared/models/position.model';

export interface Path {
  id: number;
  type: string;
  coordinates: Position[];
}
