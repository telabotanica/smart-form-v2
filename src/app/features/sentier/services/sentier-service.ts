import {computed, inject, Injectable, signal} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {environment} from '../../../../environments/environment';
import {Sentier} from '../models/sentier.model';
import {firstValueFrom} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SentierService {
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


}
