import { Injectable, signal } from '@angular/core';

export type NominatimResult = {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}

@Injectable({ providedIn: 'root' })
export class NominatimService {
  readonly results = signal<NominatimResult[]>([]);
  readonly loading = signal(false);

  private debounceTimer: ReturnType<typeof setTimeout> | null = null;

  search(query: string): void {
    if (this.debounceTimer) { clearTimeout(this.debounceTimer); }

    if (query.trim().length < 3) {
      this.results.set([]);
      return;
    }

    this.debounceTimer = setTimeout(() => this.fetchResults(query), 300);
  }

  private async fetchResults(query: string): Promise<void> {
    this.loading.set(true);
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&accept-language=fr`;
      const res = await fetch(url);
      const data: NominatimResult[] = await res.json();
      this.results.set(data);
    } catch (e) {
      console.error('Nominatim search error', e);
      this.results.set([]);
    } finally {
      this.loading.set(false);
    }
  }

  clear(): void {
    if (this.debounceTimer) { clearTimeout(this.debounceTimer); }
    this.results.set([]);
    this.loading.set(false);
  }
}
