import {Tab} from '../../fiche/models/tabs.model';

export type Taxon = {
  espece?: string;
  scientific_name: string;
  html_full_scientific_name?: string;
  genus?: string;
  family?: string;
  taxon_repository: string;
  name_id: number;
  accepted_scientific_name_id?: number;
  taxonomic_id?: number;
  vernacular_names?: string[];
  tabs?: Tab[];
}
