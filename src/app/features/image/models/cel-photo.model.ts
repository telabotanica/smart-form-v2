export type CelPhotoOccurrence = {
  id: number;
  dateObserved?: string;
  userSciName?: string;
  userSciNameId?: number;
};

export type CelPhoto = {
  id: number;
  originalName?: string;
  dateShot?: string;
  latitude?: number;
  longitude?: number;
  dateCreated: string;
  dateUpdated?: string;
  dateLinkedToOccurrence?: string;
  contentUrl?: string;
  size?: number;
  mimeType?: string;
  url: string;
  userPseudo?: string;
  occurrence?: CelPhotoOccurrence;
};
