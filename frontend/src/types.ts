export interface Album {
  id: number;
  title: string;
  artist: string;
  artist_id?: number | null;
  genre_id?: number | null;
  year: number | null;
  created_at?: string;
  updated_at?: string;
  songs?: Song[];
}

export interface Song {
  id: number;
  album_id: number;
  title: string;
  duration_seconds: number;
  position: number;
  created_at?: string;
  updated_at?: string;
}

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: "admin" | "staff";
}
