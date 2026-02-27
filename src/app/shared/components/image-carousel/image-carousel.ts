import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
  signal,
} from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { Image } from '../../../features/image/models/image.model';
import {CelPhoto} from '../../../features/image/models/cel-photo.modal';

export type CarouselImage = {
  id: number;
  url: string;
  alt?: string;
};

@Component({
  selector: 'app-image-carousel',
  imports: [NgOptimizedImage],
  templateUrl: './image-carousel.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImageCarousel {
  /** Images déjà liées à l'occurrence (mode lecture) */
  readonly images = input<Image[]>([]);

  /** Photos CEL à sélectionner (mode formulaire) */
  readonly celPhotos = input<CelPhoto[]>([]);

  /** IDs des photos CEL déjà sélectionnées */
  readonly selectedPhotoIds = input<Set<number>>(new Set());

  /** Indique si le carousel est en mode sélection (formulaire) */
  readonly selectable = input<boolean>(false);

  /** Loading state pour les photos CEL */
  readonly loading = input<boolean>(false);

  /** Émis quand une photo CEL est (dé)sélectionnée */
  readonly photoToggled = output<CelPhoto>();

  readonly activeIndex = signal(0);

  readonly items = computed<CarouselImage[]>(() => {
    const imgs = this.images();
    if (imgs.length) {
      return imgs.map((img) => ({
        id: img.id,
        url: img.url ?? '',
        alt: img.url ? `Photo ${img.id}` : 'Pas de photo',
      }));
    }

    return this.celPhotos().map((p) => ({
      id: p.id,
      url: p.url ?? '',
      alt: p.originalName ?? 'Photo CEL',
    }));
  });

  readonly activeItem = computed(() => this.items()[this.activeIndex()] ?? null);
  readonly total = computed(() => this.items().length);
  readonly hasMultiple = computed(() => this.total() > 1);

  setActive(index: number): void {
    this.activeIndex.set(index);
  }

  prev(): void {
    this.activeIndex.update((i) => (i - 1 + this.total()) % this.total());
    this.scrollToActive();
  }

  next(): void {
    this.activeIndex.update((i) => (i + 1) % this.total());
    this.scrollToActive();
  }

  isCelPhotoSelected(id: number): boolean {
    return this.selectedPhotoIds().has(id);
  }

  onThumbnailClick(index: number, celPhoto?: CelPhoto): void {
    this.setActive(index);
    if (this.selectable() && celPhoto) {
      this.photoToggled.emit(celPhoto);
    }
  }

  private scrollToActive(): void {
    const strip = document.querySelector<HTMLElement>('[data-carousel-strip]');
    if (!strip) { return; }
    const thumb = strip.children[this.activeIndex()] as HTMLElement | undefined;
    thumb?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }
}
