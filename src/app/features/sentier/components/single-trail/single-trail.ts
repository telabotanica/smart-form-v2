import {ChangeDetectionStrategy, Component, inject, input, OnInit} from '@angular/core';
import {SingleSentierService} from '../../services/single-sentier-service';
import {ErrorComponent} from '../../../../shared/components/error/error';

@Component({
  selector: 'app-single-trail',
  imports: [
    ErrorComponent
  ],
  templateUrl: './single-trail.html',
  styleUrl: './single-trail.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SingleTrail implements OnInit {
  readonly id = input.required<string>()
  sentierService= inject(SingleSentierService)

  ngOnInit(): void {
    this.sentierService.fetchSentier(this.id());
    // console.log(this.sentierService.sentier());
  }
}
