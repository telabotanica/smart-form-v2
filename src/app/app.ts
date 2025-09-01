import {ChangeDetectionStrategy, Component, HostListener, signal} from '@angular/core';
import {RouterOutlet} from '@angular/router';
import {Sidebar} from './core/layout/sidebar/sidebar';
import {Header} from './core/layout/header/header';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    Sidebar,
    Header
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
