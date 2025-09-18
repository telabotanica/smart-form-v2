export type TaxonSearch = {
  referentiel: string;
  num_tax?: number;
  retour?: string;
  limite?: number;
  recherche: string;
  debut?: number;
  referentiel_verna?: string;
  filtre?: string;
  pages_existantes?: boolean;
  nom_verna?: boolean;
}
