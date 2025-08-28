import {Fiche} from './fiche.model';

export interface FicheResultats {
  num_taxonomique: number | string;
  nom_sci: string;
  nom_sci_complet: string;
  retenu: boolean;
  num_nom: number | string;
  referentiel: string;
  noms_vernaculaires?: string[] | null;
  fiche?: Fiche | null;
}
