import {ChangeDetectionStrategy, Component, inject, OnInit} from '@angular/core';
import {SentierPublicListService} from '../../services/sentier-public-list-service';
import {ErrorComponent} from '../../../../shared/components/error/error';
import {SentierPublicFilter} from '../sentier-public-filter/sentier-public-filter';
import {Map} from '../../../../shared/components/map/map';
import {Loader} from '../../../../shared/components/loader/loader';

@Component({
  selector: 'app-public-trail-list',
  imports: [ErrorComponent, SentierPublicFilter, Map, Loader],
  templateUrl: './public-trail-list.html',
  styleUrl: './public-trail-list.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PublicTrailList implements OnInit {
  sentierService = inject(SentierPublicListService);

  ngOnInit(): void {
    this.sentierService.fetchSentiers({});
  }

  onSearch(filters: { nom?: string; auteur?: string; pmr?: number; ordre?: 'ASC' | 'DESC' }) : void{
    // Supprimer les clés dont la valeur est undefined ou vide
    const queryParams: Record<string, string> = {};
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        queryParams[key] = String(value);
      }
    });

    this.sentierService.fetchSentiers(queryParams);
  }
}
