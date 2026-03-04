import * as Exif from 'exif-js';
import { DMS, LatLngDMS } from '../_models/gpsLatLng';

/**
 * Return latitude and longitude from jpeg exif metadata
 */
export function getLatLngFromJpegArrayBuffer(arrayBuffer: ArrayBuffer): LatLngDMS {
  const exifData = Exif.readFromBinaryFile(arrayBuffer) as Record<string, unknown>;

  const _GPSLat = exifData['GPSLatitude'] as Array<{ numerator: number; denominator: number }> | undefined;
  const _GPSLng = exifData['GPSLongitude'] as Array<{ numerator: number; denominator: number }> | undefined;

  if (!_GPSLat || !_GPSLng) {
    return { lat: null, lng: null };
  }

  const GPSLat: DMS = {
    deg: _GPSLat[0].numerator / _GPSLat[0].denominator,
    min: _GPSLat[1].numerator / _GPSLat[1].denominator,
    sec: _GPSLat[2].numerator / _GPSLat[2].denominator,
  };
  const GPSLng: DMS = {
    deg: _GPSLng[0].numerator / _GPSLng[0].denominator,
    min: _GPSLng[1].numerator / _GPSLng[1].denominator,
    sec: _GPSLng[2].numerator / _GPSLng[2].denominator,
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
