import {computed, inject, Injectable, signal} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {environment} from '../../../../environments/environment';
import {firstValueFrom} from 'rxjs';
import {TaxonSearchResultats} from '../models/taxon-search-resultats.model';
import {FicheCollection} from '../../fiche/models/fiche-collection.model';
import {Taxon} from '../models/taxon.model';
import {ErrorApi} from '../../../core/models/error-api.model';
import {Occurrence} from '../../occurrence/models/occurrence.model';
import {Tab, TabSection} from '../../fiche/models/tabs.model';

@Injectable({
  providedIn: 'root'
})
export class TaxonSearchService {
  private http = inject(HttpClient);
  private smartfloreService = environment.smartfloreService;

  private readonly _taxonsQuickSearchResults = signal<TaxonSearchResultats>({} as TaxonSearchResultats);
  private readonly _taxonsSearchResults = signal<FicheCollection>({} as FicheCollection);
  private readonly _taxon = signal<Taxon>({} as Taxon);
  private readonly _taxons = signal<Taxon[]>([]);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);

  readonly taxonsQuickSearchResults = computed(() => this._taxonsQuickSearchResults());
  readonly taxonsSearchResults = computed(() => this._taxonsSearchResults());
  readonly taxon = computed(() => this._taxon());
  readonly taxons = computed(() => this._taxons());
  readonly loading = computed(() => this._loading());
  readonly error = computed(() => this._error());

  async quickSearchTaxons(params: Record<string, string | number | boolean | null | undefined> = {}): Promise<void> {
    this._loading.set(true);
    this._error.set(null);

    const queryString = Object.keys(params).length
      ? `?${new URLSearchParams(
        Object.entries(params).reduce<Record<string, string>>((acc, [key, value]) => {
          if (value !== null && value !== undefined && value !== '') {
            acc[key] = String(value);
          }
          return acc;
        }, {})
      ).toString()}`
      : '';

    try {
      const data = await firstValueFrom(
        this.http.get<TaxonSearchResultats>(`${this.smartfloreService}taxons/search${queryString}`)
      );

      this._taxonsQuickSearchResults.set(data);
    } catch (err: unknown) {
      this._error.set(
        err instanceof Error ? err.message : 'Erreur lors de la recherche de taxons'
      );
    } finally {
      this._loading.set(false);
    }
  }

  async searchTaxons(params: Record<string, string | number | boolean | null | undefined> = {}): Promise<void> {
    this._loading.set(true);
    this._error.set(null);

    const queryString = Object.keys(params).length
      ? `?${new URLSearchParams(
        Object.entries(params).reduce<Record<string, string>>((acc, [key, value]) => {
          if (value !== null && value !== undefined && value !== '' && key !== 'retour') {
            acc[key] = String(value);
          }
          return acc;
        }, {})
      ).toString()}`
      : '';

    try {
      const data = await firstValueFrom(
        this.http.get<FicheCollection>(`${this.smartfloreService}taxons${queryString}`)
      );

      this._taxonsSearchResults.set(data)
    } catch (err: unknown){
      this._error.set(
        err instanceof Error ? err.message : 'Erreur lors de la recherche de taxons'
      );
    } finally {
      this._loading.set(false);
    }
  }

  async getTaxonFiche(referentiel: string, num_nom: number): Promise<void> {
    this._loading.set(true);
    this._error.set(null);
    this._taxon.set({} as Taxon);

    try {
      const data = await firstValueFrom(
        this.http.get<Taxon>(`${this.smartfloreService}taxon/${referentiel}/${num_nom}`)
      );

      this._taxon.set(data)
    } catch (err: unknown){
      const apiError = err as ErrorApi;
      this._error.set(
        apiError.error?.error ?? 'Erreur lors de la recherche de taxons'
      );
    } finally {
      this._loading.set(false);
    }

  }

  getDetailTaxonInfos(occurrence: Occurrence): Taxon | null {
    if (!occurrence){ return null}

    this.getTaxonFiche(occurrence.taxon!.taxon_repository, occurrence.taxon!.name_id)
      .then(() => {
        return this.taxon()
      })
      .catch((err) => {
        console.error('Erreur lors de la récupération des détails du taxon', err);
        return null;
      });

    return this.taxon();
  }

  async getUniqueTaxonsBelongingToTrail(sentierId: number):Promise<void> {
    this._loading.set(true);
    this._error.set(null);

    try {
      const data = await firstValueFrom(
        this.http.get<Taxon[]>(`${this.smartfloreService}trail/${sentierId}/taxons`)
      );

      this._taxons.set(data ?? [])
    } catch (err: unknown){
      const apiError = err as ErrorApi;
      this._error.set(
        apiError.error?.error ?? 'Erreur lors de la recherche de taxons'
      );
    } finally {
      this._loading.set(false);
    }
  }

  getFullTaxon(occurrence: Occurrence): Taxon | null {
    return this.taxons().find(
      t => t.name_id === occurrence.taxon?.name_id
    ) ?? null;
  }

  hasFiche(occurrence: Occurrence): boolean {
    const fullTaxon = this.taxons().find(
      t => t.name_id === occurrence.taxon?.name_id
    );
    return fullTaxon?.tabs?.some(tab => tab.type === 'card') ?? false;
  }

  isFicheFullyCompleted(taxon: Taxon): boolean {
    let fiche: Tab | undefined = {} as Tab;
    if (! taxon.tabs){ return false;}

    fiche = taxon.tabs.find((tab: Tab) => tab.title === "Fiche Smart’Flore");

    if (!fiche || !fiche.sections) { return false; }

    const description = fiche.sections.find(
      (section: TabSection) => section.title?.trim().toLowerCase() === 'description'
    );

    if (!description){ return false ;}

    const sources = fiche.sections.find(
      (section: TabSection) => section.title?.trim().toLowerCase() === 'sources'
    );

    if (!sources){ return false ;}

    return true;
  }

}
