import {Entete} from './entete.model';
import {FicheResultats} from './fiche-resultats.model';

export interface FicheCollection {
  entete: Entete;
  resultats?: FicheResultats[] | null;
}
