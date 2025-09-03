import {ChangeDetectionStrategy, Component, effect, inject, OnInit, signal} from '@angular/core';
import {Router, RouterLink} from '@angular/router';
import {UserService} from '../../../../core/auth/services/user.service';
import {MesSentiersService} from '../../services/mes-sentiers-service';
import {ErrorComponent} from '../../../../shared/components/error/error';
import {User} from '../../../../core/auth/user.model';
import {Sentier} from '../../models/sentier.model';
import {SingleSentierService} from '../../services/single-sentier-service';
import {SentierValidationCheck} from '../../models/sentier-validation-check.model';
import {SentierValidationError} from '../../../../shared/models/sentier-validation-error.model';
import {SentierCheckErrors} from '../../../../shared/components/sentier-check-errors/sentier-check-errors';
import {SharedService} from '../../../../shared/services/shared.service';
import {ModalDeleteTrailConfirmation} from '../modal-delete-trail-confirmation/modal-delete-trail-confirmation';

@Component({
  selector: 'app-mes-sentiers',
  imports: [
    ErrorComponent,
    RouterLink,
    SentierCheckErrors,
    ModalDeleteTrailConfirmation
  ],
  templateUrl: './mes-sentiers.html',
  styleUrl: './mes-sentiers.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MesSentiers implements OnInit{
  private userService = inject(UserService);
  mesSentiersService = inject(MesSentiersService);
  sentierService= inject(SingleSentierService)
  sharedService = inject(SharedService);

  private router = inject(Router);

  user: User | null = null;
  readonly sentierChecks = signal<Record<string, SentierValidationCheck>>({});
  readonly sentierCheckErrors = signal<Record<string, SentierValidationError | null>>({});
  sentierToDelete: Sentier | null = null;
  showDeleteConfirmModal = false;

  constructor() {
    this.user = this.mesSentiersService.userMe();

    effect(() => {
      if (!this.userService.isLoggedIn()) {
        this.router.navigate(['/']);
      }
    });

    effect(() => {
      this.user = this.mesSentiersService.userMe();
    });

    effect(() => {
      const checks: Record<string, SentierValidationCheck> = {};
      const checkErrors: Record<string, SentierValidationError | null> = {};

      this.user?.trails?.forEach(s => {
        checks[s.id] = {} as SentierValidationCheck;
        checkErrors[s.id] = null;
      });

      this.sentierChecks.set(checks);
      this.sentierCheckErrors.set(checkErrors);
    });
  }

  ngOnInit(): void {
    this.mesSentiersService.fetchMe();
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
  }
  // --- End of deletion methods ---

  async checkSentier(sentier: Sentier): Promise<void> {
    const { check, error } = await this.sentierService.checkSentier(sentier);

    this.sentierChecks.update(current => ({
      ...current,
      [sentier.id]: check
    }));

    this.sentierCheckErrors.update(current => ({
      ...current,
      [sentier.id]: error
    }));
  }


}
