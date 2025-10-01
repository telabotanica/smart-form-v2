import {computed, inject, Injectable, signal} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {environment} from '../../../../environments/environment';
import {firstValueFrom} from 'rxjs';
import {TaxonSearchResultats} from '../models/taxon-search-resultats.model';
import {FicheCollection} from '../../fiche/models/fiche-collection.model';
import {Taxon} from '../models/taxon.model';

@Injectable({
  providedIn: 'root'
})
export class TaxonSearchService {
  private http = inject(HttpClient);
  private smartfloreService = environment.smartfloreService;

  private readonly _taxonsQuickSearchResults = signal<TaxonSearchResultats>({} as TaxonSearchResultats);
  private readonly _taxonsSearchResults = signal<FicheCollection>({} as FicheCollection);
  private readonly _taxon = signal<Taxon>({} as Taxon);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);

  readonly taxonsQuickSearchResults = computed(() => this._taxonsQuickSearchResults());
  readonly taxonsSearchResults = computed(() => this._taxonsSearchResults());
  readonly taxon = computed(() => this._taxon());
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
      this._error.set(
        err instanceof Error ? err.message : 'Erreur lors de la recherche de taxons'
      );
    } finally {
      this._loading.set(false);
    }

  }
}
