import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  inject,
  input,
  OnInit,
  output,
  signal,
  viewChild
} from '@angular/core';
import {Sentier} from '../../models/sentier.model';
import {SharedService} from '../../../../shared/services/shared.service';
import {SingleSentierService} from '../../services/single-sentier-service';
import {FormArray, FormBuilder, FormControl, ReactiveFormsModule, Validators} from '@angular/forms';
import {CommonModule, NgOptimizedImage} from '@angular/common';
import {Router} from '@angular/router';
import {UserService} from '../../../../core/auth/services/user.service';
import {ErrorComponent} from '../../../../shared/components/error/error';
import AuthComponent from '../../../../core/auth/components/auth';
import {DropBoxComponent} from '../../../../shared/components/drop-file/component/drop-box';
import {environment} from '../../../../../environments/environment';
import {Image} from '../../../image/models/image.model';
import {ImageService} from '../../../image/services/image-service';

@Component({
  selector: 'app-sentier-form',
  imports: [CommonModule, ReactiveFormsModule, ErrorComponent, AuthComponent, DropBoxComponent, NgOptimizedImage],
  templateUrl: './sentier-form.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SentierForm implements OnInit {
  readonly sentier = input<Sentier | null>(null);
  readonly modalClosed = output<boolean>()

  // ── Services ────────────────────────────────────────────────────────────
  imageService = inject(ImageService);
  sharedService = inject(SharedService);
  sentierService= inject(SingleSentierService)
  userService = inject(UserService);
  private fb = inject(FormBuilder);
  private readonly router = inject(Router);

  // ── View children ────────────────────────────────────────────────────────
  /** Reference to the dropbox child to read its isUploading state */
  private readonly dropBoxRef = viewChild(DropBoxComponent);

  // ── State ────────────────────────────────────────────────────────────────
  nameError = false;
  pictureError = "";
  readonly sendPhotoFlag = signal(false);
  readonly baseCelApiUrl = environment.baseCelApiUrl;
  trailPicture = signal<Image | null>(null);

  /** True while the dropbox is uploading — blocks form submission */
  protected get isUploading(): boolean {
    return this.dropBoxRef()?.isUploading() ?? false;
  }

  readonly form = signal(this.fb.group({
    name: this.fb.control(''),
    display_name: this.fb.control('', { validators: [Validators.required] }),
    best_season: this.fb.array<FormControl<boolean>>([
      this.fb.control(false, { nonNullable: true }),
      this.fb.control(false, { nonNullable: true }),
      this.fb.control(false, { nonNullable: true }),
      this.fb.control(false, { nonNullable: true })
    ]),
    prm: this.fb.control<-1 | 0 | 1>(-1, { nonNullable: true })
  }))

  ngOnInit(): void {
    const s = this.sentier();
    if (s) {
      this.form().patchValue({
        name: s.display_name ?? "",
        display_name: s.display_name ?? "",
        prm: s.prm ?? -1
      });

      // pré-remplir les checkboxes une par une
      const bestSeasonsArray = this.form().get('best_season') as FormArray<FormControl<boolean>>;
      if (s.best_season) {
        s.best_season.forEach((val, i) => bestSeasonsArray.at(i).setValue(!!val));
      }
    }
  }

  async submit(): Promise<void> {
    this.nameError = false;

    if (!this.form().valid) {
      this.nameError = true;
      return;
    }

    if(!this.userService.isLoggedIn()){return;}

    const formValue = this.form().value;
    const bestSeasonTuple: [boolean, boolean, boolean, boolean] = [
      formValue.best_season?.[0] ?? false,
      formValue.best_season?.[1] ?? false,
      formValue.best_season?.[2] ?? false,
      formValue.best_season?.[3] ?? false
    ];

    const sentierPayload: Sentier = {
      id: this.sentier()?.id ?? 0,
      name: formValue.display_name ?? '',
      display_name: formValue.display_name ?? '',
      best_season: bestSeasonTuple,
      prm: formValue.prm as -1 | 0 | 1,
      image: this.trailPicture() ?? null
    };

    if (this.sentier()) {
      await this.sentierService.updateSentier(sentierPayload);
    } else {
      const newSentier = await this.sentierService.addSentier(sentierPayload);
      if (newSentier && !this.sentierService.errorUpdate()) {
        await this.router.navigate(['/trail', newSentier.id]);
      }
    }
    this.closeModal()
  }

  // ── Photo handlers ───────────────────────────────────────────────────────
  onPhotoAdded(files: unknown[]): void {
    // Trigger upload immediately when files are accepted
    this.sendPhotoFlag.set(true);
    // Reset flag after one tick so the effect can re-trigger next time
    setTimeout(() => this.sendPhotoFlag.set(false), 0);
  }

  onPhotoUploaded(image: unknown): void {
    const uploadedImage = image as Image;
    if (this.trailPicture()){
      const deletedImage = this.trailPicture();
      this.imageService.deletePhoto(deletedImage!.id);
    }
    this.trailPicture.set(uploadedImage);
    this.pictureError = "";
    console.log('Photo uploaded:', uploadedImage);
  }

  onPhotoRejected(rejected: any): void {
    this.trailPicture.set(null);
    this.pictureError = rejected.error["hydra:description"];
    console.warn('Photos rejetées :', rejected.error["hydra:description"]);
  }

  onPostPhotoError(error: any): void {
    this.trailPicture.set(null);
    this.pictureError = error.error["hydra:description"];
    console.error('Erreur upload photo :', error.error["hydra:description"]);
  }

  onUploadedPhotoDeleted(image: unknown): void {
    if (this.trailPicture()){
      const deletedImage = this.trailPicture();
      this.trailPicture.set(null);
      this.pictureError = ""
      console.log('Photo supprimée: ', deletedImage?.url);
      this.imageService.deletePhoto(deletedImage!.id);
    }
  }

  // ── Modal ────────────────────────────────────────────────────────────────

  closeModal(): void {
    this.modalClosed.emit(true);
  }

  handleKey(event: KeyboardEvent): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.closeModal();
    }
  }

  @HostListener('window:keydown', ['$event'])
  onEscape(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      this.closeModal();
    }
  }
}
