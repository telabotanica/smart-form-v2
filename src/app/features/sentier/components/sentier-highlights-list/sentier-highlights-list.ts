import {ChangeDetectionStrategy, Component, input} from '@angular/core';
import {Sentier} from '../../models/sentier.model';
import {DatePipe} from '@angular/common';
import {RouterLink} from '@angular/router';

@Component({
  selector: 'app-sentier-highlights-list',
  imports: [
    DatePipe,
    RouterLink
  ],
  templateUrl: './sentier-highlights-list.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SentierHighlightsList {
  readonly title = input.required<string>();
  readonly icon = input.required<string>();
  readonly sentiers = input<Sentier[]>([]);
}
