import {ChangeDetectionStrategy, Component, inject, input, OnInit, signal} from '@angular/core';
import {Taxon} from '../../models/taxon.model';
import {RouterLink} from '@angular/router';
import {SharedService} from '../../../../shared/services/shared.service';
import {FicheForm} from '../../../fiche/components/fiche-form/fiche-form';
import {UserService} from '../../../../core/auth/services/user.service';
import {FicheService} from '../../../fiche/services/fiche-service';
import {Fiche} from '../../../fiche/models/fiche.model';
import {TaxonSearchService} from '../../services/taxon-search-service';
import {QrCodeButton} from '../../../../shared/components/qr-code-button/qr-code-button';

@Component({
  selector: 'app-taxon-details',
  imports: [
    RouterLink,
    FicheForm,
    QrCodeButton
  ],
  templateUrl: './taxon-details.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TaxonDetails implements OnInit {
  readonly taxon = input.required<Taxon>();
  readonly fiche = signal({} as Fiche | null);

  readonly ficheExiste = signal(false);
  readonly taxonInfos= signal<Taxon | null>(null)
  showFicheModal = false;

  sharedService = inject(SharedService);
  userService = inject(UserService);
  ficheService = inject(FicheService);
  taxonSearchService = inject(TaxonSearchService);

  ngOnInit(): void {
    this.ficheExiste.set(false);
    this.fiche.set(null);

    this.fetchFiche();
  }

  fetchFiche(): void {
    this.fiche.set(null);

    this.ficheService.fetchFiche(this.taxon().taxon_repository, this.taxon()!.taxonomic_id!)
      .then(() => {
        if (!this.ficheService.error()) {
          this.fiche.set(this.ficheService.fiche());
          this.ficheExiste.set(true);
          this.getDetailTaxonInfos();
        } else {
          this.fiche.set(null);
          this.ficheExiste.set(false);
        }
      })
      .catch((err) => {
        console.error('Erreur lors de la récupération de la fiche', err);
        this.fiche.set(null);
        this.ficheExiste.set(false);
      })
  }

  getDetailTaxonInfos(): void {
    this.taxonSearchService.getTaxonFiche(this.taxon().taxon_repository, this.taxon().name_id)
      .then(() => {
        this.taxonInfos.set(this.taxonSearchService.taxon());
      })
      .catch((err) => {
        console.error('Erreur lors de la récupération des détails du taxon', err);
      });
  }

  openFicheModal(): void {
    this.showFicheModal = true;
    this.sharedService.toggleBlurBackground()
  }

  closeFicheModal(): void {
    this.showFicheModal = false;
    this.sharedService.toggleBlurBackground()
  }

  ficheCreationSuccess(): void {
    this.ficheExiste.set(true);
    this.fetchFiche();
  }

}
