import {ChangeDetectionStrategy, Component, effect, inject, input, OnInit, signal} from '@angular/core';
import {SingleSentierService} from '../../services/single-sentier-service';
import {ErrorComponent} from '../../../../shared/components/error/error';
import {UserService} from '../../../../core/auth/services/user.service';
import {User} from '../../../../core/auth/user.model';
import {DatePipe, NgOptimizedImage} from '@angular/common';
import {Sentier} from '../../models/sentier.model';
import {SentierValidationCheck} from '../../models/sentier-validation-check.model';
import {SentierValidationError} from '../../../../shared/models/sentier-validation-error.model';
import {SentierCheckErrors} from '../../../../shared/components/sentier-check-errors/sentier-check-errors';
import {ModalDeleteTrailConfirmation} from '../modal-delete-trail-confirmation/modal-delete-trail-confirmation';
import {SharedService} from '../../../../shared/services/shared.service';
import {SentierForm} from '../../forms/sentier-form/sentier-form';
import {Map} from '../../../../shared/components/map/map';

@Component({
  selector: 'app-single-trail',
  imports: [
    ErrorComponent,
    NgOptimizedImage,
    SentierCheckErrors,
    ModalDeleteTrailConfirmation,
    DatePipe,
    SentierForm,
    Map
  ],
  templateUrl: './single-trail.html',
  styleUrl: './single-trail.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SingleTrail implements OnInit {
  user: User | null = null;
  sentierToDelete: Sentier | null = null;
  sentierToUpdate: Sentier | null = null;
  showDeleteConfirmModal = false;
  sentier: Sentier | null = null;
  showTrailModal = false;

  readonly id = input.required<number>()
  readonly isLoggedIn = signal(false);
  readonly sentierCheck = signal({} as SentierValidationCheck);
  readonly sentierCheckError = signal<SentierValidationError | null>(null);

  sentierService= inject(SingleSentierService)
  userService = inject(UserService);
  sharedService = inject(SharedService);

  constructor() {
    this.isLoggedIn.set(this.userService.isLoggedIn());
    this.user = this.userService.user();

    effect(()=>{
      this.isLoggedIn.set(this.userService.isLoggedIn());
      this.user = this.userService.user();
      this.sentier = this.sentierService.sentier();
    })
  }
  ngOnInit(): void {
    this.sentierService.fetchSentier(this.id());
    this.sharedService.blurBackground.set(false)
  }

  //TODO edit sentier
  editSentier(sentier: Sentier): Sentier {
    sentier.name = sentier.display_name + ' (modifié2)';

    this.sentierService.updateSentier(sentier);
    return sentier;
  }

  async checkSentier(sentier: Sentier): Promise<void> {
    const { check, error } = await this.sentierService.checkSentier(sentier);
    this.sentierCheck.set(check);
    this.sentierCheckError.set(error);
  }

  // --- Deletion methods ---
  openDeleteConfirmModal(sentier: Sentier): void {
    this.sharedService.toggleBlurBackground()
    this.sentierToDelete = sentier;
    this.showDeleteConfirmModal = true;
  }

  closeDeleteConfirmModal(): void {
    this.sharedService.toggleBlurBackground()
    this.sentierToDelete = null;
    this.showDeleteConfirmModal = false;
    this.sentierService.fetchSentier(this.id());
  }
  // --- End of deletion methods ---

  // --- Add / Edit methods ---
  openTrailModal(sentier: Sentier | null = null): void {
    this.sharedService.toggleBlurBackground()
    this.sentierToUpdate = sentier
    this.showTrailModal = true;
  }

  closeTrailModal(): void {
    this.sharedService.toggleBlurBackground()
    this.sentierToUpdate = null;
    this.showTrailModal = false;
    this.sentierService.fetchSentier(this.id());
  }
  // --- End of Add / Edit methods ---

}
