import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  input,
  OnInit,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import {DroppableDirective, WindowDragEvent} from '../droppable.directive';
import {FileSizePipe} from '../_pipes/fileSize';
import {FileTypePipe} from '../_pipes/fileType';
import {FileData} from '../_models/filedata';
import {LatLngDMSAltitudePhotoName} from '../_models/gpsLatLng';
import {RejectedFileData} from '../_models/rejectedFileData';
import {acceptRejectFiles} from '../_helpers/Acceptrejectfiles';
import {Image} from '../../../../features/image/models/image.model';


import { getAltitudeFromJpegArrayBuffer, getLatLngFromJpegArrayBuffer } from '../_helpers/gpsTools';

@Component({
  selector: 'app-dropfile-box',
  imports: [
    ReactiveFormsModule,
    DroppableDirective,
    FileSizePipe,
    FileTypePipe,
    DroppableDirective,
    FileSizePipe,
    FileTypePipe
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: 'drop-box.html'
})
export class DropBoxComponent implements OnInit {
  readonly label = input('Glissez vos fichiers ici');
  readonly labelHelp = input('');
  readonly labelFullWindow = input('Déposez vos fichiers');
  readonly maxFileSize = input<number>(0);
  readonly maxImageFileSize = input<number>(0);
  readonly ignoreOversizedFiles = input<boolean>(true);
  readonly ignoreOversizedImageFiles = input<boolean>(false);
  readonly allowFullWindowDrop = input<boolean>(false);
  readonly uploadTbPhotoFiles = input<boolean>(false);
  readonly showTable = input<boolean>(true);
  readonly showThumbnails = input<boolean>(false);
  readonly allowedFileTypes = input<string[]>([]);
  readonly photoUploadBaseUrl = input<string>('http://127.0.0.1:8000/api');
  readonly enabled = input<boolean>(true);
  readonly sendImages = input<boolean>(false);
  readonly reset = input<boolean>(false);

  // ── Outputs ─────────────────────────────────────────────────────────────
  readonly acceptedFilesChange = output<FileData[]>();
  readonly rejectedFilesChange = output<RejectedFileData[]>();
  readonly uploadedFilesChange = output<unknown>();
  readonly geolocatedPhotoLatLng = output<LatLngDMSAltitudePhotoName[]>();
  readonly deletedFilesChange = output<FileData[]>();
  readonly httpError = output<unknown>();

  // ── View children ────────────────────────────────────────────────────────
  private readonly fileInputRef = viewChild.required<ElementRef<HTMLInputElement>>('fileInput');
  private readonly canvasRef = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');
  private readonly dropzoneElRef = viewChild.required<ElementRef<HTMLDivElement>>('dropzoneEl');

  // ── State ────────────────────────────────────────────────────────────────
  readonly fileList = signal<FileData[]>([]);
  readonly isUploading = signal(false);
  // Keep sendingImages as an alias for template usage
  readonly sendingImages = this.isUploading;
  private readonly isFullWindow = signal(false);

  readonly nbImagesToSend = computed(() => this.fileList().filter((f) => f.uploaded === "false").length);

  readonly currentLabel = computed(() =>
    this.isFullWindow() ? this.labelFullWindow() : this.label()
  );

  readonly dropzoneClass = computed(() => {
    const base =
      'relative w-full flex flex-col items-center justify-center min-w-[100px] p-6 ' +
      'border-2 border-dashed rounded-xl cursor-pointer transition-all duration-200 bg-transparent! ';
    if (!this.enabled()) {return base + 'border-gray-300 opacity-50 cursor-not-allowed';}
    if (this.isFullWindow())
      {return (
        base +
        'fixed inset-0 z-[9999] border-primary bg-primary/10 backdrop-blur-sm ' +
        'text-white border-solid border-4 rounded-none'
      );}
    return base + 'border-primary hover:bg-primary/5';
  });

  // ── Services ─────────────────────────────────────────────────────────────
  private readonly http = inject(HttpClient);
  private readonly fb = inject(FormBuilder);

  // ── Form ─────────────────────────────────────────────────────────────────
  readonly form = this.fb.group({ files: [{ value: '', disabled: false }] });

  // ── Accepted file types ───────────────────────────────────────────────────
  private readonly allAcceptedTypes = [
    'jpeg','png','bmp','gif','pdf','json','ods','xls','xlsx','csv','odt','doc','docx','gpx','shp',
  ];

  // ── Effects ───────────────────────────────────────────────────────────────
  constructor() {
    effect(() => { if (this.sendImages()) {this.sendFiles();} });
    effect(() => { if (this.reset()) {this.resetComponent();} });
  }

  ngOnInit(): void {
    const types = this.allowedFileTypes();
    if (types.length > 0) {
      types.forEach((t) => {
        if (!this.allAcceptedTypes.includes(t)) {
          throw new Error(`[tb-dropfile-box]: "${t}" n'est pas un type valide.`);
        }
      });
    }
  }

  // ── Event handlers ────────────────────────────────────────────────────────

  onWindowDrag(event: WindowDragEvent): void {
    this.isFullWindow.set(event === 'enter');
  }

  onAcceptedFiles(files: File[]): void {
    this.processFiles(files);
  }

  onRejectedFiles(data: RejectedFileData[]): void {
    if (data.length > 0) {this.rejectedFilesChange.emit(data);}
  }

  onFilesInputChange(): void {
    const files = this.fileInputRef().nativeElement.files;
    if (!files) {return;}

    const types = this.allowedFileTypes().length > 0 ? this.allowedFileTypes() : this.allAcceptedTypes;
    const result = acceptRejectFiles(
      files, types,
      this.ignoreOversizedFiles(), this.ignoreOversizedImageFiles(),
      this.maxFileSize(), this.maxImageFileSize()
    );
    this.processFiles(result.acceptedFiles);
    this.onRejectedFiles(result.rejectedFiles);
  }

  triggerFileInput(): void {
    if (this.enabled()) {this.fileInputRef().nativeElement.click();}
  }

  // ── File processing ───────────────────────────────────────────────────────

  private processFiles(files: File[]): void {
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      let dataUrl = '';
      let arrayBuffer: ArrayBuffer | null = null;
      let dataUrlLoaded = false;
      let arrayBufferLoaded = false;

      const tryPush = (): void => {
        if (!dataUrlLoaded || !arrayBufferLoaded) {return;}

        const GPSLatLng = arrayBuffer
          ? getLatLngFromJpegArrayBuffer(arrayBuffer) as { lat: { deg: number; min: number; sec: number } | null;
          lng: { deg: number; min: number; sec: number } | null }
          : { lat: null, lng: null };
        const GPSAltitude = arrayBuffer ? getAltitudeFromJpegArrayBuffer(arrayBuffer) : null;

        const entry: FileData = {
          index: this.fileList().length,
          file,
          arrayBuffer,
          dataUrl,
          exifGPSLat: GPSLatLng.lat,
          exifGPSLng: GPSLatLng.lng,
          exifGPSAltitude: GPSAltitude,
          uploaded: "false",
        };

        this.fileList.update(() => [entry]);

        if (i === files.length - 1) {
          this.acceptedFilesChange.emit(this.fileList());
          const latLng = this.mergeLatLngFromPhotos();
          if (latLng.length > 0) {this.geolocatedPhotoLatLng.emit(latLng);}
        }
      };

      const r1 = new FileReader();
      r1.onload = (): void => {
        dataUrlLoaded = true;
        dataUrl = r1.result as string;
        tryPush();
      };

      const r2 = new FileReader();
      r2.onload = (): void => {
        arrayBufferLoaded = true;
        arrayBuffer = r2.result as ArrayBuffer;
        tryPush();
      };

      r1.readAsDataURL(file);
      r2.readAsArrayBuffer(file);
    }
  }

  isImage(file: File): boolean {
    return file.type.includes('image');
  }

  deleteFile(listIndex: number): void {
    const list = this.fileList();
    this.deletedFilesChange.emit([list[listIndex]]);
    this.fileList.update((l) => l.filter((_, i) => i !== listIndex));
  }

  deleteFileByIndex(fileIndex: number): void {
    const found = this.fileList().find((f) => f.index === fileIndex);
    if (found) {this.deletedFilesChange.emit([found]);}
    this.fileList.update((l) => l.filter((f) => f.index !== fileIndex));
  }

  resetComponent(): void {
    this.fileList.set([]);
  }

  // ── Upload ────────────────────────────────────────────────────────────────

  sendFiles(): void {
    if (!this.uploadTbPhotoFiles()) {return;}
    if (this.nbImagesToSend() === 0) {return;}
    this.isUploading.set(true);

    for (const F of this.fileList()) {
      if (F.uploaded !== "false") {continue;}

      const formData = new FormData();
      const jsonData = { originalName: F.file.name, latitude: '', longitude: '', dateShot: ''};
      const jsonBlob = new Blob([JSON.stringify(jsonData)], { type: 'text/plain' });
      formData.append('file', F.file, F.file.name);
      formData.append('json', new File([jsonBlob], 'data.json'));

      const headers = new HttpHeaders({});
      this.http.post<Image>(`${this.photoUploadBaseUrl()}/photos`, formData, { headers }).subscribe({
        next: (image) => {
          this.fileList.update((l) => l.map((f) => (f === F ? { ...f, uploaded: "true" } : f)));
          this.uploadedFilesChange.emit(image);
          this.fileList.update((l) => l.filter((f) => f !== F));
          if (this.nbImagesToSend() === 0) {this.isUploading.set(false);}
        },
        error: (e) => {
          this.httpError.emit(e);
          this.fileList.update((l) => l.map((f) => (f === F ? { ...f, uploaded: 'error' } : f)));
          this.fileList.update((l) => l.filter((f) => f !== F));
          if (this.nbImagesToSend() === 0) {this.sendingImages.set(false);}
        },
      });
    }
  }

  // ── GPS merge ─────────────────────────────────────────────────────────────

  private mergeLatLngFromPhotos(): LatLngDMSAltitudePhotoName[] {
    return this.fileList()
      .filter((d) => d.exifGPSLat && d.exifGPSLng && d.exifGPSAltitude)
      .map((d) => ({
        lat: d.exifGPSLat!,
        lng: d.exifGPSLng!,
        altitude: d.exifGPSAltitude!,
        photoName: d.file.name,
      }));
  }
}
