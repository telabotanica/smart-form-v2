import {computed, inject, Injectable, signal} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {environment} from '../../../../environments/environment';
import {Sentier} from '../../sentier/models/sentier.model';
import {firstValueFrom} from 'rxjs';
import {ErrorApi} from '../../../core/models/error-api.model';

@Injectable({
  providedIn: 'root',
})
export class AdminService {
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
        this.http.get<Sentier[]>(`${this.smartfloreService}admin/trails${queryString}`)
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

  async publishSentier(sentier:Sentier): Promise<void> {
    this._loading.set(true);
    this._error.set(null);

    try {
      const data = await firstValueFrom(this.http.post<Sentier>(
        `${this.smartfloreService}admin/trail/${sentier.id}/publish`,
        sentier
      ));
      // this._sentier.set(data ?? {} as Sentier);
    } catch (err: unknown) {
      const apiError = err as ErrorApi;
      this._error.set(
        apiError.error?.error ?? 'Erreur inconnue lors du rejet sentier'
      );
      console.error(err)
    } finally {
      this._loading.set(false);
    }
  }

  async rejectSentier(sentier:Sentier): Promise<void> {
    this._loading.set(true);
    this._error.set(null);

    try {
      const data = await firstValueFrom(this.http.post<Sentier>(
        `${this.smartfloreService}admin/trail/${sentier.id}/reject`,
        sentier
      ));
      // this._sentier.set(data ?? {} as Sentier);
    } catch (err: unknown) {
      const apiError = err as ErrorApi;
      this._error.set(
        apiError.error?.error ?? 'Erreur inconnue lors du rejet sentier'
      );
      console.error(err)
    } finally {
      this._loading.set(false);
    }
  }

  async unpublishSentier(sentier:Sentier): Promise<void> {
    this._loading.set(true);
    this._error.set(null);

    try {
      const data = await firstValueFrom(this.http.post<Sentier>(
        `${this.smartfloreService}admin/trail/${sentier.id}/unpublish`,
        sentier
      ));
      // this._sentier.set(data ?? {} as Sentier);
    } catch (err: unknown) {
      const apiError = err as ErrorApi;
      this._error.set(
        apiError.error?.error ?? 'Erreur inconnue lors du rejet sentier'
      );
      console.error(err)
    } finally {
      this._loading.set(false);
    }
  }

  async reactivateSentier(sentier:Sentier): Promise<void> {
    this._loading.set(true);
    this._error.set(null);

    try {
      const data = await firstValueFrom(this.http.post<Sentier>(
        `${this.smartfloreService}admin/trail/${sentier.id}/reactivate`,
        sentier
      ));
      // this._sentier.set(data ?? {} as Sentier);
    } catch (err: unknown) {
      const apiError = err as ErrorApi;
      this._error.set(
        apiError.error?.error ?? 'Erreur inconnue lors du rejet sentier'
      );
      console.error(err)
    } finally {
      this._loading.set(false);
    }
  }
}
