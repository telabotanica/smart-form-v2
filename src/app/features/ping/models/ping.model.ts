export type Ping = {
  id: number;
  is_logged?: boolean;
  is_located?: boolean;
  distance_from_trail?: number;
  is_online?: boolean;
  date?: string;
  trail: number;
  from_website?: boolean;
  ip?: string;
}
