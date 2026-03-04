export type DMS = {
  deg: number;
  min: number;
  sec: number;
}

export type LatLngDMS = {
  lat: DMS | null;
  lng: DMS | null;
}

export type LatLngDMSAltitudePhotoName = {
  lat: DMS;
  lng: DMS;
  altitude: number;
  photoName: string;
}
