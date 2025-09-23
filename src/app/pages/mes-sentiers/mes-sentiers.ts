import {ChangeDetectionStrategy, Component, effect, inject, OnInit, signal} from '@angular/core';
import {Router, RouterLink} from '@angular/router';
import {UserService} from '../../core/auth/services/user.service';
import {MesSentiersService} from '../../features/sentier/services/mes-sentiers-service';
import {ErrorComponent} from '../../shared/components/error/error';
import {User} from '../../core/auth/user.model';
import {Sentier} from '../../features/sentier/models/sentier.model';
import {SingleSentierService} from '../../features/sentier/services/single-sentier-service';
import {SentierValidationCheck} from '../../features/sentier/models/sentier-validation-check.model';
import {SentierValidationError} from '../../shared/models/sentier-validation-error.model';
import {SentierCheckErrors} from '../../shared/components/sentier-check-errors/sentier-check-errors';
import {SharedService} from '../../shared/services/shared.service';
import {ModalDeleteConfirmation} from '../../shared/components/modal-delete-confirmation/modal-delete-confirmation';
import {SentierForm} from '../../features/sentier/forms/sentier-form/sentier-form';
import {Loader} from '../../shared/components/loader/loader';

@Component({
  selector: 'app-mes-sentiers',
  imports: [
    ErrorComponent,
    RouterLink,
    SentierCheckErrors,
    ModalDeleteConfirmation,
    SentierForm,
    Loader
  ],
  templateUrl: './mes-sentiers.html',
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
  sentierToUpdate: Sentier | null = null;
  showDeleteConfirmModal = false;
  showTrailModal = false;

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
    this.mesSentiersService.fetchMe();
  }
  // --- End of Add / Edit methods ---


}
