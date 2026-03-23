import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  input,
  OnDestroy,
  output,
  signal,
  viewChild
} from '@angular/core';
import { DatePipe, NgOptimizedImage } from '@angular/common';
import { RouterLink } from '@angular/router';
import {Sentier} from '../../models/sentier.model';
import {QrCodeButton} from '../../../../shared/components/qr-code-button/qr-code-button';

@Component({
  selector: 'app-sentier-public-modal',
  imports: [DatePipe, NgOptimizedImage, RouterLink, QrCodeButton],
  templateUrl: './sentier-public-modal.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SentierPublicModal implements OnDestroy {
  readonly sentier = input.required<Sentier | null>();
  readonly closed = output<void>();

  readonly copied = signal(false);

  private readonly dialogRef = viewChild.required<ElementRef<HTMLDialogElement>>('detailsDialog');
  private copyTimeoutId: ReturnType<typeof setTimeout> | null = null;


  open(): void {
    this.dialogRef().nativeElement.showModal();
  }

  closeDetails(): void {
    this.dialogRef().nativeElement.close();
    this.closed.emit();
  }

  copyDetails(text: string | null | undefined): void {
    if (!text) { return; }

    if (this.copyTimeoutId !== null) {
      clearTimeout(this.copyTimeoutId);
    }

    navigator.clipboard.writeText(text).then(() => {
      this.copied.set(true);
      this.copyTimeoutId = setTimeout(() => {
        this.copied.set(false);
        this.copyTimeoutId = null;
      }, 2000);
    }).catch((err: unknown) => {
      console.error('Échec de la copie :', err);
    });
  }

  ngOnDestroy(): void {
    if (this.copyTimeoutId !== null) {
      clearTimeout(this.copyTimeoutId);
    }
  }
}
