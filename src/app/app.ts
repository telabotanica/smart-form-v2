import {ChangeDetectionStrategy, Component, signal} from '@angular/core';
import {RouterOutlet} from '@angular/router';
import AuthComponent from './core/auth/components/auth';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    AuthComponent
  ],
  templateUrl: './app.html',
  styleUrl: './app.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class App {
  protected readonly title = signal('smart-form-v2');

}
