import {Injectable, signal} from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SharedService {
  readonly blurBackground = signal(false);

  toggleBlurBackground(): void {
    this.blurBackground.set(!this.blurBackground())
  }
}
