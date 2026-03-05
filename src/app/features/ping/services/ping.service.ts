import {computed, inject, Injectable, signal} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {environment} from '../../../../environments/environment';
import {firstValueFrom} from 'rxjs';
import {Ping} from '../models/ping.model';
import {Sentier} from '../../sentier/models/sentier.model';

@Injectable({
  providedIn: 'root'
})
export class PingService {
  private http = inject(HttpClient);
  private smartfloreService = environment.smartfloreService;

  private readonly _pings = signal<Ping[]>([]);
  readonly pings = computed(() => this._pings());
  async savePing(ping: Ping): Promise<void> {
    try {
      const response = await firstValueFrom(this.http.post<Ping>(
        `${this.smartfloreService}ping`,
        ping
      ));
      console.log(response)
    } catch (err: unknown) {
      console.error(err)
    }
  }

  async fetchPings(sentier: Sentier): Promise<void> {
    try {
      const data = await firstValueFrom(this.http.get<Ping[]>(
        `${this.smartfloreService}ping/${sentier.id}`
      ));
      this._pings.set(data ?? []);
    } catch (err: unknown) {
      console.error(err)
    }
  }
}
