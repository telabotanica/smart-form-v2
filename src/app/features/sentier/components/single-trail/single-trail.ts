import {ChangeDetectionStrategy, Component, effect, inject, input, OnInit, signal} from '@angular/core';
import {SingleSentierService} from '../../services/single-sentier-service';
import {ErrorComponent} from '../../../../shared/components/error/error';
import {UserService} from '../../../../core/auth/services/user.service';
import {User} from '../../../../core/auth/user.model';
import {NgOptimizedImage} from '@angular/common';
import {Sentier} from '../../models/sentier.model';
import {SentierValidationCheck} from '../../models/sentier-validation-check.model';
import {SentierValidationError} from '../../../../shared/models/sentier-validation-error.model';
import {SentierCheckErrors} from '../../../../shared/components/sentier-check-errors/sentier-check-errors';

@Component({
  selector: 'app-single-trail',
  imports: [
    ErrorComponent,
    NgOptimizedImage,
    SentierCheckErrors
  ],
  templateUrl: './single-trail.html',
  styleUrl: './single-trail.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SingleTrail implements OnInit {
  user: User | null = null;
  readonly id = input.required<string>()
  readonly isLoggedIn = signal(false);
  // readonly sentierCheck = signal({} as SentierValidationCheck);

  readonly sentierCheck = signal({} as SentierValidationCheck);
  readonly sentierCheckError = signal<SentierValidationError | null>(null);

  sentierService= inject(SingleSentierService)
  userService = inject(UserService);

  constructor() {
    this.isLoggedIn.set(this.userService.isLoggedIn());
    this.user = this.userService.user();
    // this.sentierCheck.set({} as SentierValidationCheck);

    effect(()=>{
      this.isLoggedIn.set(this.userService.isLoggedIn());
      this.user = this.userService.user();
      // this.sentierCheck.set(this.sentierService.sentierCheck());
    })
  }
  ngOnInit(): void {
    this.sentierService.fetchSentier(this.id());
  }

  editSentier(sentier: Sentier): Sentier {
    sentier.name = sentier.display_name + ' (modifié2)';
    console.log(sentier);
    this.sentierService.updateSentier(sentier);
    return sentier;
  }

  // checkSentier(sentier: Sentier):void {
  //   this.sentierService.checkSentier(sentier);
  // }

  async checkSentier(sentier: Sentier): Promise<void> {
    const { check, error } = await this.sentierService.checkSentier(sentier);
    this.sentierCheck.set(check);
    this.sentierCheckError.set(error);
  }

}
