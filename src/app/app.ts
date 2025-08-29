import {ChangeDetectionStrategy, Component, HostListener, signal} from '@angular/core';
import {RouterOutlet} from '@angular/router';
import AuthComponent from './core/auth/components/auth';
import {PublicTrailList} from './features/sentier_public/components/public-trail-list/public-trail-list';
import {Sidebar} from './core/layout/sidebar/sidebar';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    AuthComponent,
    PublicTrailList,
    Sidebar
  ],
  templateUrl: './app.html',
  styleUrl: './app.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class App {
  protected readonly title = signal('smart-form-v2');
  showUpIcon = false;

  @HostListener('window:scroll', [])
  onScroll(): void {
    this.showUpIcon = window.scrollY > 200;
  }

  scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
