import {computed, inject, Injectable, signal} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {environment} from '../../../../environments/environment';
import {Sentier} from '../../sentier/models/sentier.model';
import {firstValueFrom} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SentierPublicListService {
  private http = inject(HttpClient);
  private smartfloreService = environment.smartfloreService;

  // --- Signals ---
  private readonly _sentiers = signal<Sentier[]>([]);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);

  // --- Exposed signals ---
  readonly sentiers = computed(() => this._sentiers());
  readonly loading = computed(() => this._loading());
  readonly error = computed(() => this._error());

  /**
   * Récupère la liste des sentiers avec des query parameters optionnels
   */
  async fetchSentiers(params: Partial<Record<string, string | number | boolean>> = {}): Promise<void> {
    this._loading.set(true);
    this._error.set(null);

    const queryString = Object.keys(params).length
      ? `?${new URLSearchParams(
        Object.entries(params).reduce<Record<string, string>>((acc, [key, value]) => {
          acc[key] = String(value);
          return acc;
        }, {})
      ).toString()}`
      : '';

    try {
      const data = await firstValueFrom(
        this.http.get<Sentier[]>(`${this.smartfloreService}trails${queryString}`)
      );

      this._sentiers.set(data ?? []);
    } catch (err: unknown) {
      this._error.set(
        err instanceof Error ? err.message : 'Erreur lors de la récupération des sentiers'
      );
    } finally {
      this._loading.set(false);
    }
  }

}
