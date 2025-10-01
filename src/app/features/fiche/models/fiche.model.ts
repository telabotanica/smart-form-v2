export type Fiche = {
  id?: number;
  tag?: string;
  nt?: string;
  referentiel?: string;
  date_modification?: string; // ISO date string
  description?: string;
  usages?: string;
  ecologie?: string;
  sources?: string;
  proprietaire?: string;
  user?: string;
  derniere_version?: boolean;
}
