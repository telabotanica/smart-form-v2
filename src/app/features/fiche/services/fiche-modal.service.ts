// fiche-modal.service.ts
import {inject, Injectable, signal} from '@angular/core';
import { Fiche } from '../models/fiche.model';
import {Occurrence} from '../../occurrence/models/occurrence.model';
import {SharedService} from '../../../shared/services/shared.service';

@Injectable({ providedIn: 'root' })
export class FicheModalService {
  readonly fiche = signal<Fiche | null>(null);
  readonly isOpen = signal(false);
  readonly occurrence = signal<Occurrence | null>(null);

  readonly sharedService = inject(SharedService);

  open(fiche: Fiche | null): void {
    this.fiche.set(fiche);
    this.isOpen.set(true);
    this.sharedService.blurBackground.set(true)
  }

  close(): void {
    this.fiche.set(null);
    this.isOpen.set(false);
    this.sharedService.blurBackground.set(false)
  }
}
