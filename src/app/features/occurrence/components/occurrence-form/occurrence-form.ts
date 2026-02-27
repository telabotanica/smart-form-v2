import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  OnInit,
  output,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TaxonSearchService } from '../../../taxon/services/taxon-search-service';
import { OccurrenceService } from '../../services/occurrence-service';
import { Position } from '../../../../shared/models/position.model';
import { Sentier } from '../../../sentier/models/sentier.model';
import { Occurrence } from '../../models/occurrence.model';
import { Taxon } from '../../../taxon/models/taxon.model';
import { ErrorComponent } from '../../../../shared/components/error/error';
import { TaxonSearch } from '../../../../shared/components/taxon-search/taxon-search';
import { ImageService } from '../../../image/services/image-service';
import { CelPhoto } from '../../../image/models/cel-photo.modal';
import { Image } from '../../../image/models/image.model';
import { ImageCarousel } from '../../../../shared/components/image-carousel/image-carousel';

@Component({
  selector: 'app-occurrence-form',
  imports: [ReactiveFormsModule, ErrorComponent, TaxonSearch, ImageCarousel],
  templateUrl: './occurrence-form.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(window:keydown)': 'onEscape($event)',
  },
})
export class OccurrenceForm implements OnInit {
  readonly position = input.required<Position>();
  readonly sentier = input.required<Sentier>();
  readonly occurrence = input<Occurrence | null>(null);
  readonly modalClosed = output<boolean>();
  readonly modalSuccessed = output<boolean>();

  readonly photos = signal<CelPhoto[]>([]);
  readonly selectedPhotoIds = signal<Set<number>>(new Set());

  readonly taxonSearchService = inject(TaxonSearchService);
  readonly occurrenceService = inject(OccurrenceService);
  readonly imageService = inject(ImageService);
  private readonly fb = inject(FormBuilder);

  readonly selectedTaxonName = signal<string>('');
  readonly selectedTaxonDetails = signal<Taxon>({} as Taxon);
  readonly newOccurrence = signal<Occurrence>({} as Occurrence);

  readonly form = signal(
    this.fb.group({
      anecdotes: this.fb.control(''),
      retour: this.fb.control('min', { validators: [Validators.required] }),
      limite: this.fb.control(10, { validators: [Validators.required] }),
    }),
  );

  readonly hasPhotos = computed(() => this.photos().length > 0);

  constructor() {
    effect(() => {
      this.photos.set(this.imageService.photos());
    });
  }

  ngOnInit(): void {
    const o = this.occurrence();
    if (o) {
      this.form().patchValue({
        anecdotes: o.anecdotes ?? '',
        retour: 'min',
        limite: 10,
      });
      this.selectedTaxonName.set(o.taxon?.scientific_name ?? '');
      this.selectedTaxonDetails.set(o.taxon ?? ({} as Taxon));
      this.newOccurrence.set(o);

      if (o.taxon?.scientific_name) {
        this.onTaxonSelected(o.taxon.scientific_name);
      }

      if (o.images?.length) {
        const ids = new Set(
          o.images.map((img) => img.cel_image_id).filter((id): id is number => id !== null),
        );
        this.selectedPhotoIds.set(ids);
      }
    }
  }

  async getCelPhotos(params: Partial<Record<string, string>> = {}): Promise<void> {
    await this.imageService.fetchPhotos(params);
  }

  onTaxonSelected(userSciName?: string): void {
    const queryParams: Record<string, string> = {};
    if (userSciName) {
      queryParams['userSciName'] = userSciName;
    }
    this.getCelPhotos(queryParams);
  }

  togglePhoto(photo: CelPhoto): void {
    this.selectedPhotoIds.update((current) => {
      const next = new Set(current);
      if (next.has(photo.id)) {
        next.delete(photo.id);
      } else {
        next.add(photo.id);
      }
      return next;
    });
  }

  resetSelection(): void {
    this.selectedTaxonName.set('');
    this.photos.set([]);
    this.selectedPhotoIds.set(new Set());
  }

  fillOccurrence(taxon: Taxon): void {
    this.selectedTaxonName.set(taxon.scientific_name);
    this.newOccurrence.set({
      position: this.position(),
      taxon,
    });
    this.onTaxonSelected(taxon.scientific_name);
  }

  private buildSelectedImages(): Image[] {
    const selectedIds = this.selectedPhotoIds();
    return this.photos()
      .filter((photo) => selectedIds.has(photo.id))
      .map((photo) => ({
        id: photo.id,
        url: photo.url,
        cel_image_id: photo.id,
      }));
  }

  async submit(): Promise<void> {
    const selectedImages = this.buildSelectedImages();

    this.newOccurrence.update((current) => ({
      ...current,
      anecdotes: this.form().get('anecdotes')?.value ?? '',
      ...(selectedImages.length > 0 ? { images: selectedImages } : {}),
    }));

    try {
      if (this.occurrence()) {
        await this.occurrenceService.updateOccurrence(this.newOccurrence());
      } else {
        if (!this.form().valid) { return; }
        await this.occurrenceService.addOccurrence(this.newOccurrence(), this.sentier());
      }

      if (!this.occurrenceService.error()) {
        this.modalSuccessed.emit(true);
        this.close();
      }
    } catch (error) {
      console.error('Error submitting occurrence:', error);
    }
  }

  close(): void {
    this.modalClosed.emit(true);
  }

  handleKey(event: KeyboardEvent): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.close();
    }
  }

  onEscape(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      this.close();
    }
  }
}
