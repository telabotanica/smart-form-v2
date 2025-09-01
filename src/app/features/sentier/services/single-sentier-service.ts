import {computed, effect, inject, Injectable, signal} from '@angular/core';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {environment} from '../../../../environments/environment';
import {Sentier} from '../models/sentier.model';
import {firstValueFrom} from 'rxjs';
import {UserService} from '../../../core/auth/services/user.service';
import {User} from '../../../core/auth/user.model';
import {ErrorApi} from '../../../core/models/error-api.model';
import {SentierValidationCheck} from '../models/sentier-validation-check.model';

@Injectable({
  providedIn: 'root'
})
export class SingleSentierService {
  private http = inject(HttpClient);
  private userService = inject(UserService);
  private user = this.userService.user();
  private smartfloreService = environment.smartfloreService;

  // --- Signals ---
  private readonly _sentier = signal<Sentier>({} as Sentier);
  private readonly _sentierCheck = signal<SentierValidationCheck>({} as SentierValidationCheck);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);

  // --- Exposed signals ---
  readonly sentier = computed(() => this._sentier());
  readonly sentierCheck = computed(() => this._sentierCheck());
  readonly loading = computed(() => this._loading());
  readonly error = computed(() => this._error());

  constructor() {
    effect(()=>{
      this.user = this.userService.user();
    })
  }

  async fetchSentier(id: string): Promise<void> {
    this._loading.set(true);
    this._error.set(null);

    try {
      const data = await firstValueFrom(this.http.get<Sentier>(`${this.smartfloreService}trail/${id}`));
      this._sentier.set(data ?? {} as Sentier);
    } catch (err: any) {
      const apiError = err as ErrorApi;
      this._error.set(
        apiError.error?.error ?? 'Erreur inconnue lors de la récupération du sentier'
      );
      console.error(err)
    } finally {
      this._loading.set(false);
    }
  }

  async addSentier(sentier:Sentier): Promise<void> {
    this._loading.set(true);
    this._error.set(null);

    try {
      const headers = this.user
        ? new HttpHeaders({ Authorization: this.user.token })
        : undefined;

      const data = await firstValueFrom(this.http.post<Sentier>(
        `${this.smartfloreService}trail`,
        sentier,
        {headers}
      ));
      this._sentier.set(data ?? {} as Sentier);
    } catch (err: unknown) {
      const apiError = err as ErrorApi;
      this._error.set(
        apiError.error?.error ?? 'Erreur inconnue lors de la mise à jour du sentier'
      );
      console.error(err)
    } finally {
      this._loading.set(false);
    }
  }

  async updateSentier(sentier:Sentier): Promise<void> {
    this._loading.set(true);
    this._error.set(null);

    try {
      const headers = this.user
        ? new HttpHeaders({ Authorization: this.user.token })
        : undefined;

      const data = await firstValueFrom(this.http.put<Sentier>(
        `${this.smartfloreService}trail/${sentier.id}`,
        sentier,
        {headers}
      ));
      this._sentier.set(data ?? {} as Sentier);
    } catch (err: unknown) {
      const apiError = err as ErrorApi;
      this._error.set(
        apiError.error?.error ?? 'Erreur inconnue lors de la mise à jour du sentier'
      );
      console.error(err)
    } finally {
      this._loading.set(false);
    }
  }

  async updateSentierImage(sentier: Sentier, imageId: string): Promise<void> {
    this._loading.set(true);
    this._error.set(null);

    try {
      const headers = this.user
        ? new HttpHeaders({ Authorization: this.user.token })
        : undefined;

      const data = await firstValueFrom(this.http.put<Sentier>(
        `${this.smartfloreService}trail/${sentier.id}/update-image?imageId=${imageId}`,
        {headers}
      ));
      this._sentier.set(data ?? {} as Sentier);
    } catch (err: unknown) {
      const apiError = err as ErrorApi;
      this._error.set(
        apiError.error?.error ?? 'Erreur inconnue lors de la mise à jour de l\'image du sentier'
      );
      console.error(err)
    } finally {
      this._loading.set(false);
    }
  }

  async deleteSentier(sentier: Sentier): Promise<void> {
    this._loading.set(true);
    this._error.set(null);

    try {
      const headers = this.user
        ? new HttpHeaders({ Authorization: this.user.token })
        : undefined;

      const data = await firstValueFrom(this.http.delete<string>(
        `${this.smartfloreService}trail/${sentier.id}`,
        {headers}
      ));
      this._sentier.set({} as Sentier);
    } catch (err: any) {
      const apiError = err as ErrorApi;
      this._error.set(
        apiError.error?.error ?? 'Erreur inconnue lors de la suppression du sentier'
      );
      console.error(err)
    } finally {
      this._loading.set(false);
    }
  }

  // Vérifier si un sentier peut être publié
  async checkSentier(sentier: Sentier): Promise<void> {
    this._loading.set(true);
    this._error.set(null);

    try {
      const data = await firstValueFrom(this.http.get<SentierValidationCheck>(`${this.smartfloreService}trail/${sentier.id}/check`));
      this._sentierCheck.set(data ?? {} as SentierValidationCheck);
    } catch (err: any) {
      const apiError = err as ErrorApi;
      this._error.set(
        apiError.error?.error ?? 'Erreur inconnue lors de la vérification du sentier'
      );
    } finally {
      this._loading.set(false);
    }
  }

  async reviewSentier(sentier:Sentier): Promise<void> {
    this._loading.set(true);
    this._error.set(null);

    try {
      const headers = this.user
        ? new HttpHeaders({ Authorization: this.user.token })
        : undefined;

      const data = await firstValueFrom(this.http.post<Sentier>(
        `${this.smartfloreService}trail/${sentier.id}/review`,
        {},
        {headers}
      ));
      this._sentier.set(data ?? {} as Sentier);
    } catch (err: unknown) {
      const apiError = err as ErrorApi;
      this._error.set(
        apiError.error?.error ?? 'Erreur inconnue lors de l\'envoie en publication du sentier'
      );
      console.error(err)
    } finally {
      this._loading.set(false);
    }
  }
}
