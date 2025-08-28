import {ChangeDetectionStrategy, Component, signal} from '@angular/core';
import {RouterOutlet} from '@angular/router';
import AuthComponent from './core/auth/components/auth';
import {PublicTrailList} from './features/public_trail/components/public-trail-list/public-trail-list';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    AuthComponent,
    PublicTrailList
  ],
  templateUrl: './app.html',
  styleUrl: './app.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class App {
  protected readonly title = signal('smart-form-v2');

}
