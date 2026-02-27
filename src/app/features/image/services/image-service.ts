import {computed, inject, Injectable, signal} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {environment} from '../../../../environments/environment';
import {CelPhoto} from '../models/cel-photo.modal';
import {firstValueFrom} from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ImageService {
  private http = inject(HttpClient);
  private celImageUrl = environment.celImageUrl;

  // --- Signals ---
  private readonly _photos = signal<CelPhoto[]>([]);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);

  // --- Exposed signals ---
  readonly photos = computed(() => this._photos());
  readonly loading = computed(() => this._loading());
  readonly error = computed(() => this._error());

  async fetchPhotos(params: Partial<Record<string, string>> = {}): Promise<void> {
    this._loading.set(true);
    this._error.set(null);

    const queryString = Object.keys(params).length
      ? `&${new URLSearchParams(
        Object.entries(params).reduce<Record<string, string>>((acc, [key, value]) => {
          acc[key] = String(value);
          return acc;
        }, {})
      ).toString()}`
      : '';

    try {
      const data: any = await firstValueFrom(
        this.http.get<CelPhoto[]>(`${this.celImageUrl}${queryString}`)
      );

      this._photos.set(data["hydra:member"] ?? []);
    } catch (err: unknown) {
      this._error.set(
        err instanceof Error ? err.message : 'Erreur lors de la récupération des photos'
      );
    } finally {
      this._loading.set(false);
    }
  }

}
