export type Taxon = {
  espece: string;
  scientificName: string;
  htmlFullScientificName?: string;
  genus?: string;
  family?: string;
  taxonRepository: string;
  nameId: number;
  acceptedScientificNameId?: number;
  taxonomicId?: number;
  vernacularNames?: string[];
  tabs?: string;
}
