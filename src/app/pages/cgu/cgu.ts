import {ChangeDetectionStrategy, Component, inject} from '@angular/core';
import {SharedService} from '../../shared/services/shared.service';
import {NgOptimizedImage} from '@angular/common';

@Component({
  selector: 'app-cgu',
  imports: [NgOptimizedImage],
  templateUrl: './cgu.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Cgu {
  sharedService = inject(SharedService);
}
