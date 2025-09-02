import {computed, inject, Injectable, signal} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {environment} from '../../../../environments/environment';
import {firstValueFrom} from 'rxjs';
import {User} from '../../../core/auth/user.model';
import {ErrorApi} from '../../../core/models/error-api.model';

@Injectable({
  providedIn: 'root'
})
export class MesSentiersService {
  private http = inject(HttpClient);
  private smartfloreService = environment.smartfloreService;

  // --- Signals ---
  private readonly _userMe = signal<User | null>(null);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);

  // --- Exposed signals ---
  readonly userMe = computed(() => this._userMe());
  readonly loading = computed(() => this._loading());
  readonly error = computed(() => this._error());

  async fetchMe(): Promise<void> {
    this._loading.set(true);
    this._error.set(null);

    try {
      const data = await firstValueFrom(
        this.http.get<User>(`${this.smartfloreService}me`)
      );

      this._userMe.set(data ?? []);
    } catch (err: unknown) {
      const apiError = err as ErrorApi;
      this._error.set(
        apiError.error?.error ?? 'Erreur lors de la récupération des données utilisateurs'
      );
    } finally {
      this._loading.set(false);
    }
  }
}
