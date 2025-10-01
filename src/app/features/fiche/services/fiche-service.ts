import {computed, inject, Injectable, signal} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {environment} from '../../../../environments/environment';
import {Fiche} from '../models/fiche.model';
import {firstValueFrom} from 'rxjs';
import {ErrorApi} from '../../../core/models/error-api.model';

@Injectable({
  providedIn: 'root'
})
export class FicheService {
  private http = inject(HttpClient);
  private smartfloreService = environment.smartfloreService;

  private readonly _fiche = signal<Fiche>({} as Fiche);
  private readonly _loading = signal(false);
  private readonly _loadingUpdate = signal(false);
  private readonly _error = signal<string | null>(null);
  private readonly _errorUpdate = signal<string | null>(null);

  readonly fiche = computed(() => this._fiche());
  readonly loading = computed(() => this._loading());
  readonly loadingUpdate = computed(() => this._loadingUpdate());
  readonly error = computed(() => this._error());
  readonly errorUpdate = computed(() => this._errorUpdate());

  async fetchFiche(referentiel: string, taxonomic_id: number): Promise<void> {
    this._loading.set(true);
    this._error.set(null);
    this._fiche.set({} as Fiche);

    try {
      const data = await firstValueFrom(this.http.get<Fiche>(
        `${this.smartfloreService}fiche/${referentiel}/${taxonomic_id}`
      ));
      this._fiche.set(data ?? {} as Fiche);
    } catch (err: unknown) {
      const apiError = err as ErrorApi;
      this._error.set(
        apiError.error?.error ?? 'Erreur inconnue lors de la récupération de la fiche'
      );
      console.error(err)
    } finally {
      this._loading.set(false);
    }
  }

  async createFiche(referentiel: string, taxonomic_id: number, fiche:Fiche): Promise<Fiche | null> {
    this._loadingUpdate.set(true);
    this._errorUpdate.set(null);

    try {
      const data = await firstValueFrom(this.http.post<Fiche>(
        `${this.smartfloreService}fiche/${referentiel}/${taxonomic_id}`,
        fiche
      ));
      this._fiche.set(data ?? {} as Fiche);
      return data ?? null;
    } catch (err: unknown) {
      const apiError = err as ErrorApi;
      this._errorUpdate.set(
        apiError.error?.error ?? 'Erreur inconnue lors de la mise à jour de la fiche'
      );
      console.error(err)
      return null;
    } finally {
      this._loadingUpdate.set(false);
    }
  }

  async updateFiche(referentiel: string, taxonomic_id: number, fiche:Fiche): Promise<void> {
    this._loadingUpdate.set(true);
    this._errorUpdate.set(null);

    try {
      const data = await firstValueFrom(this.http.put<Fiche>(
        `${this.smartfloreService}fiche/${referentiel}/${taxonomic_id}`,
        fiche
      ));
      this._fiche.set(data ?? {} as Fiche);
    } catch (err: unknown) {
      const apiError = err as ErrorApi;
      this._errorUpdate.set(
        apiError.error?.error ?? 'Erreur inconnue lors de la mise à jour de la fiche'
      );
      console.error(err)
    } finally {
      this._loadingUpdate.set(false);
    }
  }
}
