import {computed, inject, Injectable, signal} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {environment} from '../../../../environments/environment';
import {Sentier} from '../models/sentier.model';
import {firstValueFrom} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SingleSentierService {
  private http = inject(HttpClient);
  private smartfloreService = environment.smartfloreService;

  // --- Signals ---
  private readonly _sentier = signal<Sentier>({} as Sentier);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);

  // --- Exposed signals ---
  readonly sentier = computed(() => this._sentier());
  readonly loading = computed(() => this._loading());
  readonly error = computed(() => this._error());

  async fetchSentier(id: string): Promise<void> {
    this._loading.set(true);
    this._error.set(null);

    try {
      const data = await firstValueFrom(this.http.get<Sentier>(`${this.smartfloreService}trail/${id}`));
      this._sentier.set(data ?? {} as Sentier);
    } catch (err: unknown) {
      this._error.set(
        err instanceof Error ? err.message : 'Erreur lors de la récupération du sentier'
      );
    } finally {
      this._loading.set(false);
    }
  }



}
