import {ChangeDetectionStrategy, Component, computed, effect, inject, input, signal} from '@angular/core';
import {SharedService} from '../../services/shared.service';
import {Taxon} from '../../../features/taxon/models/taxon.model';
import {Sentier} from '../../../features/sentier/models/sentier.model';

@Component({
  selector: 'app-qr-code-button',
  imports: [],
  templateUrl: './qr-code-button.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class QrCodeButton {
  sharedService = inject(SharedService);

  readonly taxon = input<Taxon | null>(null);
  readonly sentier = input<Sentier | null>(null)

  readonly outUrl = signal ("");

  readonly taxonUrl = signal ("");
  readonly sentierUrl = signal ("");
  readonly qrCodeUrl = computed(() =>
    this.outUrl()
  );
  readonly title = signal("");

  readonly name = signal<string | undefined>("")
  readonly url = signal(this.sharedService.url().origin)
  readonly referentiel = signal("")
  readonly nt = signal<number | undefined>(0)
  readonly name_id = signal(0)

  constructor() {
    effect(() => {
      if (this.taxon()) {
        this.name.set(this.taxon()!.scientific_name)
        this.referentiel.set(this.taxon()!.taxon_repository)
        this.nt.set(this.taxon()!.taxonomic_id)
        this.name_id.set(this.taxon()!.name_id)

        this.taxonUrl.set(
          `${this.sharedService.env().qrCodeUrl}${this.name()}/${this.url()}/fiche/${this.referentiel()}/${this.nt()}/${this.name_id()}.png`
        )

        this.outUrl.set(this.taxonUrl());
        this.title.set('Voir le QR code de la fiche')
      }
    })

    effect(() => {
      if (this.sentier()) {
        this.name.set(this.sentier()!.display_name)

        this.sentierUrl.set(
          `${this.sharedService.env().qrCodeUrl}${this.name()}/${this.url()}/trail/${this.sentier()!.id}.png`
        )

        this.outUrl.set(this.sentierUrl());
        this.title.set('Voir le QR code du sentier')
      }
    })
  }
}
