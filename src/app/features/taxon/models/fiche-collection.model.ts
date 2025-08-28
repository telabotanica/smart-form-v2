import {Entete} from './entete.model';
import {FicheResultats} from './fiche-resultats.model';

export type FicheCollection = {
  entete: Entete;
  resultats?: FicheResultats[] | null;
}
