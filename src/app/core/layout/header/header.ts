import {ChangeDetectionStrategy, Component, effect, inject, signal} from '@angular/core';
import AuthComponent from '../../auth/components/auth';
import {SentierForm} from '../../../features/sentier/components/sentier-form/sentier-form';
import {Sentier} from '../../../features/sentier/models/sentier.model';
import {UserService} from '../../auth/services/user.service';
import {SharedService} from '../../../shared/services/shared.service';
import {User} from '../../auth/user.model';

@Component({
  selector: 'app-header',
  imports: [
    AuthComponent,
    SentierForm
  ],
  templateUrl: './header.html',
  styleUrl: './header.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Header {
  userService = inject(UserService);
  sharedService = inject(SharedService);

  readonly isLoggedIn = signal(false);

  user: User | null = null;
  showTrailModal = false;

  constructor() {
    this.isLoggedIn.set(this.userService.isLoggedIn());
    this.user = this.userService.user();


    effect(()=>{
      this.isLoggedIn.set(this.userService.isLoggedIn());
      this.user = this.userService.user();
    })
  }
  openTrailModal(sentier: Sentier | null = null): void {
    this.sharedService.toggleBlurBackgroundApp()
    this.showTrailModal = true;
  }

  closeTrailModal(): void {
    this.sharedService.toggleBlurBackgroundApp()
    this.showTrailModal = false;
  }
}
