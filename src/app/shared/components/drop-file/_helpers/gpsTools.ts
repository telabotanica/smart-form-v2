import * as Exif from 'exif-js';
import { DMS, LatLngDMS } from '../_models/gpsLatLng';

/**
 * Return latitude and longitude from jpeg exif metadata
 */
export function getLatLngFromJpegArrayBuffer(arrayBuffer: ArrayBuffer): LatLngDMS {
  const exifData = Exif.readFromBinaryFile(arrayBuffer) as Record<string, unknown>;

  const gpsLat = exifData['GPSLatitude'] as { numerator: number; denominator: number }[] | undefined;
  const gpsLng = exifData['GPSLongitude'] as { numerator: number; denominator: number }[] | undefined;

  if (!gpsLat || !gpsLng) {
    return { lat: null, lng: null };
  }

  const GPSLat: DMS = {
    deg: gpsLat[0].numerator / gpsLat[0].denominator,
    min: gpsLat[1].numerator / gpsLat[1].denominator,
    sec: gpsLat[2].numerator / gpsLat[2].denominator,
  };
  const GPSLng: DMS = {
    deg: gpsLng[0].numerator / gpsLng[0].denominator,
    min: gpsLng[1].numerator / gpsLng[1].denominator,
    sec: gpsLng[2].numerator / gpsLng[2].denominator,
  };

  return { lat: GPSLat, lng: GPSLng };
}

/**
 * Return altitude from jpeg exif metadata
 */
export function getAltitudeFromJpegArrayBuffer(arrayBuffer: ArrayBuffer): number | null {
  const exifData = Exif.readFromBinaryFile(arrayBuffer) as Record<string, unknown>;
  const alt = exifData['GPSAltitude'] as { numerator: number; denominator: number } | undefined;
  return alt ? alt.numerator / alt.denominator : null;
}
