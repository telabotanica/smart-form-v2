import {ChangeDetectionStrategy, Component} from '@angular/core';
import AuthComponent from '../../auth/components/auth';

@Component({
  selector: 'app-header',
  imports: [
    AuthComponent
  ],
  templateUrl: './header.html',
  styleUrl: './header.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Header {

}
