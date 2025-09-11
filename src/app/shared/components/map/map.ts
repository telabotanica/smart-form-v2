import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  input,
  signal,
  viewChild
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { Sentier } from '../../../features/sentier/models/sentier.model';
import * as L from 'leaflet';

type LatLngTuple = [number, number];

@Component({
  selector: 'app-map',
  imports: [RouterLink],
  templateUrl: './map.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Map implements AfterViewInit {
  readonly sentiers = input<Sentier[] | null>(null);
  readonly selectedSentier = signal<Sentier | null>(null);

  // Template references
  readonly mapContainer = viewChild<ElementRef<HTMLElement>>('mapContainer');
  readonly detailsDialog = viewChild<ElementRef<HTMLDialogElement>>('detailsDialog');

  // Private map handles
  private leafletMap: L.Map | null = null;
  private markersLayer: L.LayerGroup | null = null;
  private userMarker: L.Marker | null = null;
  private osmTileLayer: L.TileLayer | null = null;

  // Icons
  private readonly sentierIcon = L.divIcon({
    className: 'marker',
    html: '<span class="inline-block rounded-full bg-emerald-600 border border-white w-3.5 h-3.5 shadow"></span>',
    iconSize: [14, 14],
    iconAnchor: [7, 7]
  });
  private readonly userIcon = L.divIcon({
    className: 'marker-user',
    html: '<span class="inline-block rounded-full bg-sky-600 border border-white w-4 h-4 shadow"></span>',
    iconSize: [16, 16],
    iconAnchor: [8, 8]
  });

  // Derived state
  readonly hasSentiers = computed(() => (this.sentiers() ?? []).length > 0);

  constructor() {
    // Re-render markers when input sentiers changes
    effect(() => {
      const list = this.sentiers();
      if (list !== undefined) {
        this.renderMarkers();
      }
    });
  }

  ngAfterViewInit(): void {
    this.initMap();
    this.renderMarkers();
  }

  // Initialize Leaflet map with OSM as default
  private initMap(): void {
    const container = this.mapContainer()?.nativeElement;
    if (!container) { return; }

    this.leafletMap = L.map(container, {
      center: [43.611, 3.876],
      zoom: 7,
      zoomControl: true
    });

    this.osmTileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(this.leafletMap);

    this.markersLayer = L.layerGroup().addTo(this.leafletMap);
  }

  private invalidateMapSize(): void {
    const map = this.leafletMap;
    if (map) {
      map.invalidateSize();
    }
  }

  private getSentierLatLng(s: Sentier): LatLngTuple | null {
    const lat = s.position?.start?.lat ?? s.path?.coordinates?.[0]?.lat;
    const lng = s.position?.start?.lng ?? s.path?.coordinates?.[0]?.lng;
    if (typeof lat === 'number' && typeof lng === 'number') {return [lat, lng];}
    return null;
  }

  private renderMarkers(): void {
    const list = this.sentiers() ?? [];
    const map = this.leafletMap;
    const layer = this.markersLayer;
    if (!map || !layer) {return;}

    layer.clearLayers();

    const bounds: L.LatLngTuple[] = [];

    for (const s of list) {
      const latlng = this.getSentierLatLng(s);
      if (!latlng) {continue;}
      const marker = L.marker(
        latlng,
        { icon: this.sentierIcon, title: s.display_name ?? s.name ?? `Sentier #${s.id}` }
      );
      marker.on('click', () => this.openDetails(s));
      marker.addTo(layer);
      bounds.push(latlng);
    }

    if (bounds.length) {
      const b = L.latLngBounds(bounds);
      map.fitBounds(b, { padding: [20, 20] });
    }
  }

  // Geolocation
  locateMe(): void {
    if (!navigator.geolocation) {return;}
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const map = this.leafletMap;
        if (map) {
          if (!this.userMarker) {
            this.userMarker = L.marker([latitude, longitude], { title: 'Vous êtes ici', icon: this.userIcon });
            this.userMarker.addTo(this.markersLayer!);
          } else {
            this.userMarker.setLatLng([latitude, longitude]);
          }
          map.setView([latitude, longitude], 14);
        }
      },
      () => {
        // ignore errors silently for now
        console.error('Geolocation error');
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 }
    );
  }

  // Modal controls
  openDetails(s: Sentier): void {
    this.selectedSentier.set(s);
    this.detailsDialog()?.nativeElement?.showModal();
  }

  closeDetails(): void {
    this.detailsDialog()?.nativeElement?.close();
    this.selectedSentier.set(null);
  }

}
