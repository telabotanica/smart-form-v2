import {ChangeDetectionStrategy, Component, inject} from '@angular/core';
import {Router} from '@angular/router';

@Component({
  selector: 'app-unauthorized',
  imports: [],
  templateUrl: './unauthorized.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Unauthorized {
  private router = inject(Router);

  goHome(): void {
    this.router.navigate(['/']);
  }
}
