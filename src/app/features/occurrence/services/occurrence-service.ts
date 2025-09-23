import {computed, inject, Injectable, signal} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {environment} from '../../../../environments/environment';
import {Occurrence} from '../models/occurrence.model';
import {firstValueFrom} from 'rxjs';
import {Sentier} from '../../sentier/models/sentier.model';
import {ErrorApi} from '../../../core/models/error-api.model';

@Injectable({
  providedIn: 'root'
})
export class OccurrenceService {
  private http = inject(HttpClient);
  private smartfloreService = environment.smartfloreService;

  private readonly _occurrence = signal<Occurrence>({} as Occurrence);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);

  readonly occurrence = computed(() => this._occurrence());
  readonly loading = computed(() => this._loading());
  readonly error = computed(() => this._error());

  async addOccurrence(occurrence: Occurrence, sentier: Sentier): Promise<void> {
    this._loading.set(true);
    this._error.set(null);

    try {
      const data = await firstValueFrom(this.http.post<Occurrence>(
        `${this.smartfloreService}occurrence/${sentier.id}`,
        occurrence
      ));
      this._occurrence.set(data ?? {} as Occurrence);
    } catch (err: unknown) {
      const apiError = err as ErrorApi;
      this._error.set(
        apiError.error?.error ?? 'Erreur inconnue lors de l\'ajout de l\'occurrence'
      );
      console.error(err)
    } finally {
      this._loading.set(false);
    }
  }

  async updateOccurrence(occurrence: Occurrence): Promise<void> {
    this._loading.set(true);
    this._error.set(null);
    try {
      const data = await firstValueFrom(this.http.put<Occurrence>(
        `${this.smartfloreService}occurrence/${occurrence.id}`,
        occurrence
      ));
      this._occurrence.set(data ?? {} as Occurrence);
    } catch (err: unknown) {
      const apiError = err as ErrorApi;
      this._error.set(
        apiError.error?.error ?? 'Erreur inconnue lors de la mise à jour de l\'occurrence'
      );
      console.error(err)
    } finally {
      this._loading.set(false);
    }
  }

  async deleteOccurrence(occurrence: Occurrence): Promise<void> {
    this._loading.set(true);
    this._error.set(null);

    try {
      await firstValueFrom(this.http.delete<void>(
        `${this.smartfloreService}occurrence/${occurrence.id}`
      ));
      this._occurrence.set({} as Occurrence);
    } catch (err: unknown) {
      const apiError = err as ErrorApi;
      this._error.set(
        apiError.error?.error ?? 'Erreur inconnue lors de la suppression de l\'occurrence'
      );
      console.error(err)
    } finally {
      this._loading.set(false);
    }
  }

}
