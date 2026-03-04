import {
  Directive,
  inject,
  input,
  OnDestroy,
  OnInit,
  output,
  Renderer2,
  signal,
} from '@angular/core';
import {RejectedFileData} from './_models/rejectedFileData';
import {acceptRejectFiles} from './_helpers/Acceptrejectfiles';

export type WindowDragEvent = 'enter' | 'leave';

@Directive({
  selector: '[appDroppable]',
  host: {
    '[class]': 'hostClass()',
    '(dragover)': 'onDragOver($event)',
    '(dragleave)': 'onDragLeave($event)',
    '(mouseout)': 'onMouseOut($event)',
    '(drop)': 'onDrop($event)',
  },
})
export class DroppableDirective implements OnInit, OnDestroy {
  // Inputs
  readonly allowedFileTypes = input<string[]>([]);
  readonly maxFileSize = input<number>(0);
  readonly maxImageFileSize = input<number>(0);
  readonly ignoreOversizedFiles = input<boolean>(false);
  readonly ignoreOversizedImageFiles = input<boolean>(false);
  readonly allowFullWindowDrop = input<boolean>(false);

  // Outputs
  readonly filesChange = output<File[]>();
  readonly filesRejected = output<RejectedFileData[]>();
  readonly windowDrag = output<WindowDragEvent>();

  // Internal state
  private readonly isOver = signal(false);
  private readonly isFullWindow = signal(false);

  protected hostClass = (): string => {
    const classes = ['dropzone'];
    if (this.isOver() && !this.allowFullWindowDrop()) {classes.push('over');}
    if (this.isFullWindow()) {classes.push('fullWindow');}
    return classes.join(' ');
  };

  private readonly renderer = inject(Renderer2);
  private unlisten: (() => void)[] = [];

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    if (!this.allowFullWindowDrop()) {this.isOver.set(true);}
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    if (!this.allowFullWindowDrop()) {this.isOver.set(false);}
  }

  onMouseOut(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isOver.set(false);
  }

  onDrop(event: DragEvent):void  {
    event.preventDefault();
    event.stopPropagation();
    this.isOver.set(false);
    this.isFullWindow.set(false);

    if (!event.dataTransfer) {return;}
    const result = acceptRejectFiles(
      event.dataTransfer.files,
      this.allowedFileTypes(),
      this.ignoreOversizedFiles(),
      this.ignoreOversizedImageFiles(),
      this.maxFileSize(),
      this.maxImageFileSize()
    );
    this.filesChange.emit(result.acceptedFiles);
    this.filesRejected.emit(result.rejectedFiles);
  }

  ngOnInit(): void {
    if (!this.allowFullWindowDrop()) {return;}

    const unlistenMouseOut = this.renderer.listen('document', 'mouseout', (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      this.isFullWindow.set(false);
      this.windowDrag.emit('leave');
    });

    const unlistenDragEnter = this.renderer.listen('document', 'dragenter', (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      this.isFullWindow.set(true);
      this.windowDrag.emit('enter');
    });

    this.unlisten = [unlistenMouseOut, unlistenDragEnter];
  }

  ngOnDestroy(): void {
    this.unlisten.forEach((fn) => fn());
  }
}
