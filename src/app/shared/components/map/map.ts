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
import {
  OccurrenceModalDetail
} from '../../../features/occurrence/components/occurrence-modal-detail/occurrence-modal-detail';
import {SharedService} from '../../services/shared.service';
import {OccurrenceService} from '../../../features/occurrence/services/occurrence-service';
import {SingleSentierService} from '../../../features/sentier/services/single-sentier-service';
import {ErrorComponent} from '../error/error';
import { Position } from '../../models/position.model';
import { WaypointListComponent } from '../waypoint-list/waypoint-list';
import { MapUtilsService } from '../../services/map-utils.service';
import {UserService} from '../../../core/auth/services/user.service';
import {User} from '../../../core/auth/user.model';

type LatLngTuple = [number, number];

@Component({
  selector: 'app-map',
  imports: [RouterLink, OccurrenceModalDetail, ErrorComponent, WaypointListComponent],
  templateUrl: './map.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Map implements AfterViewInit {
  readonly sentiers = input<Sentier[] | null>(null);
  readonly singleSentier = input<Sentier | null>(null);
  readonly selectedSentier = signal<Sentier | null>(null);
  readonly selectedOccurrence = signal<Occurrence | null>(null);
  // Local working copy of current single sentier to ensure immediate UI updates
  readonly currentSentier = signal<Sentier | null>(null);
  readonly isLoggedIn = signal(false);
  user: User | null = null;

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
  occurrenceService = inject(OccurrenceService);
  singleSentierService = inject(SingleSentierService);
  mapUtils = inject(MapUtilsService);
  userService = inject(UserService);

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

  // Div icons for single-sentier start/end using Material Symbols
  private readonly startDivIcon: L.DivIcon = L.divIcon({
    className: 'map-material-marker',
    html: '<span class="material-symbols-outlined bg-primary-200 rounded-full">home_pin</span>',
    iconSize: [28, 28],
    iconAnchor: [14, 28]
  });
  private readonly endDivIcon: L.DivIcon = L.divIcon({
    className: 'map-material-marker',
    html: '<span class="material-symbols-outlined bg-primary-100 rounded-full">sports_score</span>',
    iconSize: [28, 28],
    iconAnchor: [14, 28]
  });

  // readonly hasSentiers = computed(() => (this.sentiers() ?? []).length > 0);

  constructor() {
    this.isLoggedIn.set(this.userService.isLoggedIn());
    this.user = this.userService.user();

    effect(() => {
      const list = this.sentiers();
      const single = this.singleSentier();
      if (single) {
        this.currentSentier.set(single);
        this.renderSingleSentier(single);
      } else if (list !== undefined) {
        this.currentSentier.set(null);
        this.renderMarkers();
      }
    });

    effect(()=>{
      this.isLoggedIn.set(this.userService.isLoggedIn());
      this.user = this.userService.user();
      this.canEditmap()

      const single = this.singleSentier();
      if (single) {
        this.renderSingleSentier(single);
      }
    })
  }

  ngAfterViewInit(): void {
    this.initMap();
    const single = this.singleSentier();
    if (single) {
      this.currentSentier.set(single);
      this.renderSingleSentier(single);
    } else {
      this.currentSentier.set(null);
      this.renderMarkers();
    }
  }

  private initMap(): void {
    const container = this.mapContainer()?.nativeElement;
    if (!container) { return; }

    this.leafletMap = L.map(container, {
      center: [43.611, 3.876],
      zoom: 7,
      zoomControl: true,
      maxZoom: 19
    });

    this.osmTileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      maxNativeZoom: 19,
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

    this.canEditmap()
  }

  private canEditmap(){
    const map = this.leafletMap;
    if (this.isLoggedIn() && this.user && map){
      // Right-click: open a lightweight context menu to add a waypoint at the clicked location
      map.on('contextmenu', (e: L.LeafletMouseEvent) => {
        const single = this.currentSentier();
        if (!single || !this.sharedService.canEditTrail(this.user, single, this.userService.isUserAdmin())) { return; }
        this.buildMapContextMenu(e.latlng, single);
      });
    }
    //TODO: enlever le context menu quand on se déconnecte depuis la vue single trail
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

    const coords = s.path?.coordinates ?? [];
    if (coords.length > 0) {
      this.addEditablePath(s, bounds);
    } else {
      this.addStartMarker(s, bounds);
      this.addEndMarker(s, bounds);
    }
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
      const isSingle = !!this.singleSentier();
      const draggable = isSingle ? this.sharedService.canEditTrail(this.user, this.singleSentier()!, this.userService.isUserAdmin()) : false
      const marker = L.marker(
        pt,
        { icon: isSingle ? this.startDivIcon : this.sentierIcon, title: 'Départ', draggable: draggable }
      );

      if (isSingle) {
        marker.on('dragend', async () => {
          const ll = marker.getLatLng();
          const newStart = { lat: ll.lat, lng: ll.lng };
          const updated: Sentier = {
            ...s,
            position: {
              start: newStart,
              end: s.position?.end ?? newStart,
            }
          };
          try {
            await this.singleSentierService.updateSentier(updated);
          } catch (e) {
            console.error('Failed to update sentier start position', e);
          }
        });
      }

      this.markersLayer!.addLayer(marker);
      bounds.push(pt);
    }
  }

  private addEndMarker(s: Sentier, bounds: LatLngTuple[]): void {
    const end = s.position?.end;
    if (end && typeof end.lat === 'number' && typeof end.lng === 'number') {
      const pt: LatLngTuple = [end.lat, end.lng];
      const isSingle = !!this.singleSentier();
      const draggable = isSingle ? this.sharedService.canEditTrail(this.user, this.singleSentier()!, this.userService.isUserAdmin()) : false
      const marker = L.marker(
        pt,
        { icon: isSingle ? this.endDivIcon : this.sentierIcon, title: 'Arrivée', draggable: draggable }
      );

      if (isSingle) {
        marker.on('dragend', async () => {
          const ll = marker.getLatLng();
          const newEnd = { lat: ll.lat, lng: ll.lng };
          const updated: Sentier = {
            ...s,
            position: {
              start: s.position?.start ?? newEnd,
              end: newEnd,
            }
          };
          try {
            await this.singleSentierService.updateSentier(updated);
          } catch (e) {
            console.error('Failed to update sentier end position', e);
          }
        });
      }

      this.markersLayer!.addLayer(marker);
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
    const isSingle = !!this.singleSentier();
    const draggable = isSingle ? this.sharedService.canEditTrail(this.user, this.singleSentier()!, this.userService.isUserAdmin()) : false
    for (const occ of occurrences) {
      const p = occ.position;
      if (p && typeof p.lat === 'number' && typeof p.lng === 'number') {
        const pt: LatLngTuple = [p.lat, p.lng];
        const title = occ.taxon?.scientific_name
          ? `Obs: ${occ.taxon.scientific_name}`
          : `Observation #${occ.id}`;

        const marker = L.marker(pt, { icon: this.occurrenceIcon, title, draggable: draggable });
        marker.on('click', () => this.openOccurrence(occ));

        if (isSingle) {
          marker.on('dragend', async () => {
            const ll = marker.getLatLng();
            const updated: Occurrence = {
              ...occ,
              position: { lat: ll.lat, lng: ll.lng }
            };
            // Reflect the change locally in the UI state
            const current = this.selectedOccurrence();
            if (current?.id === occ.id) {
              this.selectedOccurrence.set(updated);
            }
            try {
              await this.occurrenceService.updateOccurrence(updated);
            } catch (e) {
              console.error('Failed to update occurrence position', e);
            }
          });
        }

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

  // ----- Editable route (waypoints) -----
  private addEditablePath(s: Sentier, bounds: LatLngTuple[]): void {
    const map = this.leafletMap;
    if (!map || !this.routeLayer) { return; }
    const coords: Position[] = (s.path?.coordinates ?? [])
      .filter((c): c is Position => typeof c?.lat === 'number' && typeof c?.lng === 'number');

    const lastIndex = coords.length - 1;

    coords.forEach((c, i) => {
      const pt: LatLngTuple = [c.lat, c.lng];

      // First and last: use Material Symbols for start/end in single-sentier mode
      // Intermediates: small dot with the same color as the path
      let marker: L.Marker;
      const draggable = this.sharedService.canEditTrail(this.user, this.singleSentier()!, this.userService.isUserAdmin())
      if (i === 0 || i === lastIndex) {
        const title = i === 0 ? 'Départ' : 'Arrivée';
        const icon = i === 0 ? this.startDivIcon : this.endDivIcon;
        marker = L.marker(pt, { icon, draggable: draggable, title });
      } else {
        const dot = L.divIcon({
          className: '',
          html: `<span class="
            inline-block w-[10px] h-[10px] rounded-full border-2 bg-primary
            border-white shadow-[0_0_0_1px_rgba(0,0,0,0.15)]" ></span>`,
          iconSize: [10, 10],
          iconAnchor: [5, 5]
        });
        marker = L.marker(pt, { icon: dot, draggable: draggable, title: `Étape ${i + 1}` });
      }

      marker.on('dragend', async () => {
        const ll = marker.getLatLng();
        const newCoords = coords.map((p, idx) => idx === i ? { lat: ll.lat, lng: ll.lng } : p);
        await this.persistPath(s, newCoords);
      });

      this.routeLayer!.addLayer(marker);
      bounds.push(pt);
    });
  }

  private buildMapContextMenu(latlng: L.LatLng, s: Sentier): void {
    const container = this.mapUtils.createPopupMenu([
      {
        label: 'Ajouter une étape ici',
        onClick: async (): Promise<void> => {
          const p: Position = { lat: latlng.lat, lng: latlng.lng };
          const coords = (s.path?.coordinates ?? []).slice();
          const idx = this.mapUtils.nearestInsertionIndex(coords as Position[], p);
          coords.splice(idx, 0, p);
          await this.persistPath(s, coords as Position[]);
        }
      }
    ], this.leafletMap ?? undefined);

    L.popup({ closeButton: true, autoClose: true })
      .setLatLng(latlng)
      .setContent(container)
      .openOn(this.leafletMap!);
  }

  private async persistPath(s: Sentier, coords: Position[]): Promise<void> {
    const newPath = {
      id: s.path?.id ?? 0,
      type: s.path?.type ?? 'LineString',
      coordinates: coords
    };
    const updated: Sentier = {
      ...s,
      path: newPath,
      position: coords.length > 0 ? { start: coords[0], end: coords[coords.length - 1] } : s.position
    };
    if (this.isLoggedIn() && this.sharedService.canEditTrail(this.user, updated, this.userService.isUserAdmin())) {
      try {
        await this.singleSentierService.updateSentier(updated);
        // Update local state immediately so UI reflects changes (e.g., waypoint list)
        this.currentSentier.set(updated);
        // Re-render immediately
        this.renderSingleSentier(updated);
      } catch (e) {
        console.error('Failed to persist path', e);
      }
    }
  }

  // ----- Sidebar actions (reorder waypoints) -----
  async removeWaypoint(index: number): Promise<void> {
    const s = this.currentSentier();
    if (!s) { return; }
    const arr = (s.path?.coordinates ?? []).slice() as Position[];
    if (index < 0 || index >= arr.length) { return; }
    arr.splice(index, 1);
    await this.persistPath(s, arr);
  }

  async onReorder(newOrder: Position[]): Promise<void> {
    const s = this.currentSentier();
    if (!s) { return; }
    await this.persistPath(s, newOrder);
  }

}
