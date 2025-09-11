import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  effect,
  ElementRef, inject,
  input,
  signal,
  viewChild
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { Sentier } from '../../../features/sentier/models/sentier.model';
import { Occurrence } from '../../../features/occurrence/models/occurrence.model';
import * as L from 'leaflet';
import 'leaflet.markercluster';
import {NgOptimizedImage} from '@angular/common';
import {
  OccurrenceModalDetail
} from '../../../features/occurrence/components/occurrence-modal-detail/occurrence-modal-detail';
import {SharedService} from '../../services/shared.service';

type LatLngTuple = [number, number];

@Component({
  selector: 'app-map',
  imports: [RouterLink, NgOptimizedImage, OccurrenceModalDetail],
  templateUrl: './map.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Map implements AfterViewInit {
  readonly sentiers = input<Sentier[] | null>(null);
  readonly singleSentier = input<Sentier | null>(null);
  readonly selectedSentier = signal<Sentier | null>(null);
  readonly selectedOccurrence = signal<Occurrence | null>(null);

  // Template references
  readonly mapContainer = viewChild<ElementRef<HTMLElement>>('mapContainer');
  readonly detailsDialog = viewChild<ElementRef<HTMLDialogElement>>('detailsDialog');
  readonly occurrenceDialog = viewChild<ElementRef<HTMLDialogElement>>('occurrenceDialog');

  // Private map handles
  private leafletMap: L.Map | null = null;
  private markersLayer: L.LayerGroup | null = null;
  private routeLayer: L.LayerGroup | null = null;
  private userMarker: L.Marker | null = null;
  private osmTileLayer: L.TileLayer | null = null;

  sharedService = inject(SharedService)

  // Icons (use image assets instead of CSS dots)
  private readonly sentierIcon = L.icon({
    iconUrl: 'assets/images/marker-icon-orange.svg',
    iconSize: [25, 41],
    iconAnchor: [12, 41]
  });
  private readonly userIcon = L.icon({
    iconUrl: 'assets/images/marker-icon-user.svg',
    iconSize: [24, 24],
    iconAnchor: [12, 12]
  });
  private readonly occurrenceIcon = L.icon({
    iconUrl: 'assets/images/marker-icon-vert.svg',
    iconSize: [25, 41],
    iconAnchor: [12, 41]
  });

  // readonly hasSentiers = computed(() => (this.sentiers() ?? []).length > 0);

  constructor() {
    effect(() => {
      const list = this.sentiers();
      const single = this.singleSentier();
      if (single) {
        this.renderSingleSentier(single);
      } else if (list !== undefined) {
        this.renderMarkers();
      }
    });
  }

  ngAfterViewInit(): void {
    this.initMap();
    const single = this.singleSentier();
    if (single) {
      this.renderSingleSentier(single);
    } else {
      this.renderMarkers();
    }
  }

  private initMap(): void {
    const container = this.mapContainer()?.nativeElement;
    if (!container) { return; }

    this.leafletMap = L.map(container, {
      center: [43.611, 3.876],
      zoom: 7,
      zoomControl: true
    });

    this.osmTileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 22,
      attribution: 'Map data &copy; <a href="https://openstreetmap.org" target="_blank">OpenStreetMap</a> ' +
        'contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/" target="_blank">CC-BY-SA</a>'
    }).addTo(this.leafletMap);

    // Initialize a MarkerClusterGroup from the npm plugin (with a safe fallback)
    const mcgFactory = (L as unknown as { markerClusterGroup?: (opts?: unknown) => L.LayerGroup }).markerClusterGroup;
    if (mcgFactory) {
      this.markersLayer = mcgFactory({
        disableClusteringAtZoom: 15,
        spiderfyOnMaxZoom: true,
        showCoverageOnHover: false
      }).addTo(this.leafletMap);
    } else {
      this.markersLayer = L.layerGroup().addTo(this.leafletMap);
    }

    // Layer to hold the route polyline and any non-cluster overlays
    this.routeLayer = L.layerGroup().addTo(this.leafletMap);
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

  private renderSingleSentier(s: Sentier): void {
    if (!this.leafletMap || !this.markersLayer || !this.routeLayer) {
      return;
    }

    this.markersLayer.clearLayers();
    this.routeLayer.clearLayers();

    const bounds: LatLngTuple[] = [];

    this.addStartMarker(s, bounds);
    this.addEndMarker(s, bounds);
    this.addPolyline(s, bounds);
    this.addOccurrences(s, bounds);

    if (bounds.length) {
      const b = L.latLngBounds(bounds);
      this.leafletMap.fitBounds(b, { padding: [20, 20] });
    }
  }

  private addStartMarker(s: Sentier, bounds: LatLngTuple[]): void {
    const start = s.position?.start;
    if (start && typeof start.lat === 'number' && typeof start.lng === 'number') {
      const pt: LatLngTuple = [start.lat, start.lng];
      this.markersLayer!.addLayer(
        L.marker(pt, { icon: this.sentierIcon, title: 'Départ' })
      );
      bounds.push(pt);
    }
  }

  private addEndMarker(s: Sentier, bounds: LatLngTuple[]): void {
    const end = s.position?.end;
    if (end && typeof end.lat === 'number' && typeof end.lng === 'number') {
      const pt: LatLngTuple = [end.lat, end.lng];
      this.markersLayer!.addLayer(
        L.marker(pt, { icon: this.sentierIcon, title: 'Arrivée' })
      );
      bounds.push(pt);
    }
  }

  private addPolyline(s: Sentier, bounds: LatLngTuple[]): void {
    const coords = s.path?.coordinates ?? [];
    const polyPoints: LatLngTuple[] = coords
      .filter((c): c is { lat: number; lng: number } => typeof c?.lat === 'number' && typeof c?.lng === 'number')
      .map(c => [c.lat, c.lng]);

    if (polyPoints.length > 1) {
      const poly = L.polyline(polyPoints, {
        color: '#f97316',
        weight: 4,
        opacity: 0.9,
        dashArray: '6 8',
      });
      this.routeLayer!.addLayer(poly);
      bounds.push(...polyPoints);
    } else if (polyPoints.length === 1) {
      bounds.push(polyPoints[0]);
    }
  }

  private addOccurrences(s: Sentier, bounds: LatLngTuple[]): void {
    const occurrences = s.occurrences ?? [];
    for (const occ of occurrences) {
      const p = occ.position;
      if (p && typeof p.lat === 'number' && typeof p.lng === 'number') {
        const pt: LatLngTuple = [p.lat, p.lng];
        const title = occ.taxon?.scientific_name
          ? `Obs: ${occ.taxon.scientific_name}`
          : `Observation #${occ.id}`;

        const marker = L.marker(pt, { icon: this.occurrenceIcon, title });
        marker.on('click', () => this.openOccurrence(occ));
        this.markersLayer!.addLayer(marker);
        bounds.push(pt);
      }
    }
  }

  private renderMarkers(): void {
    const list = this.sentiers() ?? [];
    const map = this.leafletMap;
    const layer = this.markersLayer;
    if (!map || !layer) {return;}

    layer.clearLayers();
    this.routeLayer?.clearLayers?.();

    const bounds: L.LatLngTuple[] = [];

    for (const s of list) {
      const latlng = this.getSentierLatLng(s);
      if (!latlng) {continue;}
      const marker = L.marker(
        latlng,
        { icon: this.sentierIcon, title: s.display_name ?? s.name ?? `Sentier #${s.id}` }
      );
      marker.on('click', () => this.openDetails(s));
      (layer as unknown as { addLayer: (m: L.Marker) => void }).addLayer(marker);
      bounds.push(latlng);
    }

    if (bounds.length) {
      const b = L.latLngBounds(bounds);
      map.fitBounds(b, { padding: [20, 20] });
    }
  }

  locateMe(): void {
    if (!navigator.geolocation) {return;}
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const map = this.leafletMap;
        if (map) {
          if (!this.userMarker) {
            this.userMarker = L.marker([latitude, longitude], { title: 'Vous êtes ici', icon: this.userIcon });
            this.userMarker.addTo(map);
          } else {
            this.userMarker.setLatLng([latitude, longitude]);
          }
          map.setView([latitude, longitude], 14);
        }
      },
      () => {
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

  openOccurrence(o: Occurrence): void {
    this.selectedOccurrence.set(o);
    this.occurrenceDialog()?.nativeElement?.showModal();
  }

  closeOccurrence = (): void => {
    this.occurrenceDialog()?.nativeElement?.close();
    this.selectedOccurrence.set(null);
  };


}
