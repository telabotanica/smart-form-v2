import {ChangeDetectionStrategy, Component, computed, input} from '@angular/core';
import {Sentier} from '../../models/sentier.model';
import {SentierHighlightsList} from '../sentier-highlights-list/sentier-highlights-list';

@Component({
  selector: 'app-sentier-highlights',
  imports: [SentierHighlightsList],
  templateUrl: './sentier-highlights.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SentierHighlights {
  readonly sentiers = input<Sentier[]>([]);

  readonly recentSentiers = computed(() =>
    [...this.sentiers()]
      .filter(s => {
        if (!s.date_publication) { return false; }
        const d = new Date(s.date_publication);
        return !isNaN(d.getTime());
      })
      .sort((a, b) => new Date(b.date_publication!).getTime() - new Date(a.date_publication!).getTime())
      .slice(0, 5)
  );

  readonly popularSentiers = computed(() =>
    [...this.sentiers()]
      .filter(s => s.occurrences_count !== null && s.occurrences_count !== undefined && s.occurrences_count >= 0)
      .sort((a, b) => (b.occurrences_count ?? 0) - (a.occurrences_count ?? 0))
      .slice(0, 5)
  );
}
