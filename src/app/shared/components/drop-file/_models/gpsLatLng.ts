export type DMS = {
  deg: number;
  min: number;
  sec: number;
}

export type LatLngDMS = {
  lat: DMS;
  lng: DMS;
}

export type LatLngDMSAltitudePhotoName = {
  lat: DMS;
  lng: DMS;
  altitude: number;
  photoName: string;
}
