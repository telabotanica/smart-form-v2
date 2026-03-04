export type FileData = {
  index: number;
  file: File;
  arrayBuffer: unknown;
  dataUrl: string;
  initialFileSize?: number;
  imageReducerIterations?: number;
  exifGPSLat?: { deg: number; min: number; sec: number } | null;
  exifGPSLng?: { deg: number; min: number; sec: number } | null;
  exifGPSAltitude?: number | null;
  uploaded: true | false | 'error';
}
