import {Pipe, PipeTransform} from '@angular/core';

@Pipe({ name: 'fileType' })
export class FileTypePipe implements PipeTransform {
  private readonly map: Record<string, string> = {
    'image/png': 'Image PNG',
    'image/jpeg': 'Image JPEG',
    'image/gif': 'Image GIF',
    'image/bmp': 'Image BMP',
    'application/pdf': 'Document PDF',
    'application/json': 'Fichier JSON',
    'text/csv': 'Fichier CSV',
    'application/gpx+xml': 'Fichier GPS',
    'application/vnd.oasis.opendocument.spreadsheet': 'Feuille de calcul',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'Fichier Excel',
    'application/vnd.ms-excel': 'Fichier Excel',
    'application/vnd.oasis.opendocument.text': 'Document texte',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'Fichier Word',
    'application/msword': 'Fichier Word',
  };

  transform(value: string, fileName?: string): string {
    if (this.map[value]) {return this.map[value];}
    if (!value && fileName) {
      const ext = fileName.slice(-4).toLowerCase();
      if (ext === '.gpx') {return 'Fichier GPS';}
      if (ext === '.shp') {return 'Fichier Shapefile';}
    }
    return 'Format inconnu';
  }
}
