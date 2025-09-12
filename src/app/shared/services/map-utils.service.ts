import { Injectable } from '@angular/core';
import * as L from 'leaflet';
import { Position } from '../models/position.model';

@Injectable({ providedIn: 'root' })
export class MapUtilsService {
  // UI helper to build a simple popup menu
  createPopupMenu(
    items: { label: string; onClick: () => void | Promise<void> }[],
    leafletMap?: L.Map
  ): HTMLElement {
    const div = document.createElement('div');
    div.style.display = 'flex';
    div.style.flexDirection = 'column';
    div.style.gap = '6px';

    items.forEach(item => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = item.label;
      btn.style.padding = '6px 8px';
      btn.style.border = '1px solid #e5e7eb';
      btn.style.borderRadius = '6px';
      btn.style.background = '#fff';
      btn.style.cursor = 'pointer';
      btn.addEventListener('click', async () => {
        try {
          await item.onClick();
        } finally {
          // Close any open popup after an action
          leafletMap?.closePopup();
        }
      });
      div.appendChild(btn);
    });

    return div;
  }

  // Compute the insertion index in a polyline to place a new point
  nearestInsertionIndex(coords: Position[], p: Position): number {
    if (coords.length <= 1) { return coords.length; }
    let bestIdx = 1;
    let bestDist = Number.POSITIVE_INFINITY;

    for (let i = 0; i < coords.length - 1; i++) {
      const a = coords[i];
      const b = coords[i + 1];
      const d = this.pointToSegmentDistance(p, a, b);
      if (d < bestDist) {
        bestDist = d;
        bestIdx = i + 1;
      }
    }
    return bestIdx;
  }

  // Distance from point p to the segment ab
  pointToSegmentDistance(p: Position, a: Position, b: Position): number {
    const x = p.lng; const y = p.lat;
    const x1 = a.lng; const y1 = a.lat;
    const x2 = b.lng; const y2 = b.lat;

    const A = x - x1;
    const B = y - y1;
    const C = x2 - x1;
    const D = y2 - y1;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;
    if (lenSq !== 0) {
      param = dot / lenSq;
    }

    let xx: number; let yy: number;

    if (param < 0) {
      xx = x1; yy = y1;
    } else if (param > 1) {
      xx = x2; yy = y2;
    } else {
      xx = x1 + param * C;
      yy = y1 + param * D;
    }

    const dx = x - xx;
    const dy = y - yy;
    return Math.sqrt(dx * dx + dy * dy);
  }
}
