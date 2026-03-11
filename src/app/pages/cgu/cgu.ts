import {ChangeDetectionStrategy, Component, computed, inject} from '@angular/core';
import {SharedService} from '../../shared/services/shared.service';

@Component({
  selector: 'app-cgu',
  imports: [],
  templateUrl: './cgu.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Cgu {
  sharedService = inject(SharedService);
}
