import {acceptedFileTypes} from '../_vars/Acceptedfiletypes';

export function isImage(file: File): boolean {
  return file.type.includes('image');
}

export function acceptRejectFiles(
  files: FileList | File[],
  allowedFileTypes: string[],
  ignoreOversizedFiles: boolean,
  ignoreOversizedImageFiles: boolean,
  maxFileSize: number,
  maxImageFileSize: number
): { acceptedFiles: File[]; rejectedFiles: { file: File; message: string }[] } {
  const acceptedFiles: File[] = [];
  const rejectedFiles: { file: File; message: string }[] = [];

  const fileArray: File[] = Array.from(files).slice(0, 50);

  for (const file of fileArray) {
    if (!isImage(file) && ignoreOversizedFiles && file.size > maxFileSize * 1000) {
      rejectedFiles.push({ file, message: 'Fichier trop volumineux' });
      continue;
    }
    if (isImage(file) && ignoreOversizedImageFiles && file.size > maxImageFileSize * 1000) {
      rejectedFiles.push({ file, message: 'Image trop volumineuse' });
      continue;
    }

    const matched = acceptedFileTypes.find((af) => file.type === af.mime);
    const ext = file.name.slice(-3).toLowerCase();

    if (matched) {
      if (allowedFileTypes.includes(matched.type)) {
        acceptedFiles.push(file);
      } else {
        rejectedFiles.push({ file, message: `Format ${file.type} non autorisé` });
      }
    } else if (
      (ext === 'gpx' && allowedFileTypes.includes('gpx')) ||
      (ext === 'shp' && allowedFileTypes.includes('shp'))
    ) {
      acceptedFiles.push(file);
    } else {
      rejectedFiles.push({ file, message: 'Format non reconnu' });
    }
  }

  return { acceptedFiles, rejectedFiles };
}
