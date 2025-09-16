import {Injectable, signal} from '@angular/core';
import {User} from '../../core/auth/user.model';
import {Sentier} from '../../features/sentier/models/sentier.model';

@Injectable({
  providedIn: 'root'
})
export class SharedService {
  readonly blurBackground = signal(false);

  toggleBlurBackground(): void {
    this.blurBackground.set(!this.blurBackground())
  }

  canEditTrail(user: User | null, trail: Sentier, isAdmin: boolean): boolean {
    if (!user) { return false}

    if (isAdmin || user.id === trail.author_id) { return true }

    return false
  }

}
