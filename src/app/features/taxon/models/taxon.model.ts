export type Taxon = {
  espece?: string;
  scientific_name: string;
  html_full_scientific_name?: string;
  genus?: string;
  family?: string;
  taxon_repository: string;
  name_id: string | number;
  accepted_scientific_name_id?: number;
  taxonomic_id?: number;
  vernacular_names?: string[];
  tabs?: string;
}
