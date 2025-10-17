import {ChangeDetectionStrategy, Component, computed, effect, inject, input, signal} from '@angular/core';
import {SharedService} from '../../services/shared.service';
import {Taxon} from '../../../features/taxon/models/taxon.model';

@Component({
  selector: 'app-qr-code-button',
  imports: [],
  templateUrl: './qr-code-button.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class QrCodeButton {
  sharedService = inject(SharedService);

  readonly taxon = input<Taxon>({} as Taxon);
  readonly qrCodeUrl = computed(() =>
    `${this.sharedService.env().qrCodeUrl}
    ${this.name()}/
    ${this.url()}
    /fiche/
    ${this.referentiel()}/
    ${this.nt()}/
    ${this.name_id()}
    .png`
  );

  readonly name = signal("")
  readonly url = signal("")
  readonly referentiel = signal("")
  readonly nt = signal<number | undefined>(0)
  readonly name_id = signal(0)

  constructor() {
    effect(() => {
      if (this.taxon()) {
        this.name.set(this.taxon().scientific_name)
        this.url.set(this.sharedService.url().origin)
        this.referentiel.set(this.taxon().taxon_repository)
        this.nt.set(this.taxon().taxonomic_id)
        this.name_id.set(this.taxon().name_id)
      }
    })
  }


}
