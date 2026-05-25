import mysql from "mysql2/promise";
import { env } from "../env.js";

export const pool = mysql.createPool({
  host: env.mysql.host,
  port: env.mysql.port,
  user: env.mysql.user,
  password: env.mysql.password,
  database: env.mysql.database,
  waitForConnections: true,
  connectionLimit: 10,
});

export interface AlbumRow {
  id: number;
  title: string;
  artist: string;
  artist_id: number | null;
  genre_id: number | null;
  year: number | null;
  created_at: Date;
  updated_at: Date;
}

export interface SongRow {
  id: number;
  album_id: number;
  title: string;
  duration_seconds: number;
  position: number;
  created_at: Date;
  updated_at: Date;
}

export interface UserRow {
  id: number;
  name: string;
  email: string;
  password_hash: string;
  role: "admin" | "staff";
  created_at: Date;
  updated_at: Date;
}
