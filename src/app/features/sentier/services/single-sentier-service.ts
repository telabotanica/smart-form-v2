import {computed, inject, Injectable, signal} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {environment} from '../../../../environments/environment';
import {Sentier} from '../models/sentier.model';
import {firstValueFrom} from 'rxjs';
import {UserService} from '../../../core/auth/services/user.service';
import {ErrorApi} from '../../../core/models/error-api.model';
import {SentierValidationCheck} from '../models/sentier-validation-check.model';
import {SentierValidationError} from '../../../shared/models/sentier-validation-error.model';

@Injectable({
  providedIn: 'root'
})
export class SingleSentierService {
  private http = inject(HttpClient);
  private userService = inject(UserService);
  private smartfloreService = environment.smartfloreService;

  // --- Signals ---
  private readonly _sentier = signal<Sentier>({} as Sentier);
  // private readonly _sentierCheck = signal<SentierValidationCheck>({} as SentierValidationCheck);
  private readonly _loading = signal(false);
  private readonly _loadingUpdate = signal(false);
  private readonly _error = signal<string | null>(null);
  private readonly _errorUpdate = signal<string | null>(null);
  // private readonly _errorCheck = signal<string | null>(null);

  // --- Exposed signals ---
  readonly sentier = computed(() => this._sentier());
  // readonly sentierCheck = computed(() => this._sentierCheck());
  readonly loading = computed(() => this._loading());
  readonly loadingUpdate = computed(() => this._loadingUpdate());
  readonly error = computed(() => this._error());
  readonly errorUpdate = computed(() => this._errorUpdate());
  // readonly errorCheck = computed(() => this._errorCheck());

  async fetchSentier(id: string): Promise<void> {
    this._loading.set(true);
    this._error.set(null);

    try {
      const data = await firstValueFrom(this.http.get<Sentier>(
        `${this.smartfloreService}trail/${id}`
      ));
      this._sentier.set(data ?? {} as Sentier);
    } catch (err: unknown) {
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
    this._loadingUpdate.set(true);
    this._errorUpdate.set(null);

    try {
      const data = await firstValueFrom(this.http.post<Sentier>(
        `${this.smartfloreService}trail`,
        sentier
      ));
      this._sentier.set(data ?? {} as Sentier);
    } catch (err: unknown) {
      const apiError = err as ErrorApi;
      this._errorUpdate.set(
        apiError.error?.error ?? 'Erreur inconnue lors de la mise à jour du sentier'
      );
      console.error(err)
    } finally {
      this._loadingUpdate.set(false);
    }
  }

  async updateSentier(sentier:Sentier): Promise<void> {
    this._loadingUpdate.set(true);
    this._errorUpdate.set(null);

    try {
      const data = await firstValueFrom(this.http.put<Sentier>(
        `${this.smartfloreService}trail/${sentier.id}`,
        sentier
      ));
      this._sentier.set(data ?? {} as Sentier);
    } catch (err: unknown) {
      const apiError = err as ErrorApi;
      this._errorUpdate.set(
        apiError.error?.error ?? 'Erreur inconnue lors de la mise à jour du sentier'
      );
      console.error(err)
    } finally {
      this._loadingUpdate.set(false);
    }
  }

  async updateSentierImage(sentier: Sentier, imageId: string): Promise<void> {
    this._loadingUpdate.set(true);
    this._errorUpdate.set(null);

    try {
      const data = await firstValueFrom(this.http.put<Sentier>(
        `${this.smartfloreService}trail/${sentier.id}/update-image?imageId=${imageId}`,
        {}
      ));
      this._sentier.set(data ?? {} as Sentier);
    } catch (err: unknown) {
      const apiError = err as ErrorApi;
      this._errorUpdate.set(
        apiError.error?.error ?? 'Erreur inconnue lors de la mise à jour de l\'image du sentier'
      );
      console.error(err)
    } finally {
      this._loadingUpdate.set(false);
    }
  }

  async deleteSentier(sentier: Sentier): Promise<void> {
    this._loading.set(true);
    this._error.set(null);

    try {
      await firstValueFrom(this.http.delete<string>(
        `${this.smartfloreService}trail/${sentier.id}`
      ));
      this._sentier.set({} as Sentier);
    } catch (err: unknown) {
      const apiError = err as ErrorApi;
      this._error.set(
        apiError.error?.error ?? 'Erreur inconnue lors de la suppression du sentier'
      );
      console.error(err)
    } finally {
      this._loading.set(false);
    }
  }

  async checkSentier(sentier: Sentier): Promise<{
    check: SentierValidationCheck;
    error: SentierValidationError | null
  }> {
    let result: SentierValidationCheck = {} as SentierValidationCheck;
    let error: SentierValidationError | null = null;

    try {
      result = await firstValueFrom(this.http.get<SentierValidationCheck>(
        `${this.smartfloreService}trail/${sentier.id}/check`
      )) ?? {} as SentierValidationCheck;
    } catch (err: any) {
      error = err.error?.error ?? {} as SentierValidationError;
      console.log(err);
    }

    return { check: result, error };
  }

  async reviewSentier(sentier:Sentier): Promise<void> {
    this._loading.set(true);
    this._error.set(null);

    try {
      const data = await firstValueFrom(this.http.post<Sentier>(
        `${this.smartfloreService}trail/${sentier.id}/review`,
        {}
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
