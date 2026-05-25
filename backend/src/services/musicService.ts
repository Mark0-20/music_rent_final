import { pool, type AlbumRow, type SongRow } from "../db/mysql.js";
import { AlbumMongo } from "../db/mongo.js";
import type { RowDataPacket, ResultSetHeader } from "mysql2";

type SqlParam = string | number | Date | Buffer | boolean | null;

async function syncAlbumToMongo(mysqlAlbumId: number): Promise<void> {
  const [albumRows] = await pool.execute<AlbumRow[] & RowDataPacket[]>(
    `SELECT id, title, artist, artist_id, genre_id, year, created_at, updated_at FROM albums WHERE id = ?`,
    [mysqlAlbumId],
  );
  const album = albumRows[0];
  if (!album) return;

  const [songRows] = await pool.execute<SongRow[] & RowDataPacket[]>(
    `SELECT id, title, duration_seconds, position FROM songs WHERE album_id = ? ORDER BY position ASC, id ASC`,
    [mysqlAlbumId],
  );

  await AlbumMongo.findOneAndUpdate(
    { mysqlAlbumId: album.id },
    {
      mysqlAlbumId: album.id,
      title: album.title,
      artist: album.artist,
      year: album.year,
      songs: songRows.map((s) => ({
        mysqlId: s.id,
        title: s.title,
        durationSeconds: s.duration_seconds,
        position: s.position,
      })),
    },
    { upsert: true, new: true },
  );
}

async function deleteAlbumMongo(mysqlAlbumId: number): Promise<void> {
  await AlbumMongo.deleteOne({ mysqlAlbumId });
}

export async function listAlbums(): Promise<(AlbumRow & { songs?: SongRow[] })[]> {
  const [albumRows] = await pool.query<AlbumRow[] & RowDataPacket[]>(
    `SELECT id, title, artist, artist_id, genre_id, year, created_at, updated_at FROM albums ORDER BY id DESC`,
  );
  const ids = albumRows.map((a) => a.id);
  if (ids.length === 0) return [];
  const [songRows] = await pool.query<SongRow[] & RowDataPacket[]>(
    `SELECT id, album_id, title, duration_seconds, position, created_at, updated_at
     FROM songs WHERE album_id IN (${ids.map(() => "?").join(",")})
     ORDER BY album_id ASC, position ASC, id ASC`,
    ids,
  );
  const byAlbum = new Map<number, SongRow[]>();
  for (const s of songRows) {
    const list = byAlbum.get(s.album_id) ?? [];
    list.push(s);
    byAlbum.set(s.album_id, list);
  }
  return albumRows.map((a) => ({ ...a, songs: byAlbum.get(a.id) ?? [] }));
}

export async function getAlbum(id: number): Promise<(AlbumRow & { songs: SongRow[] }) | null> {
  const [rows] = await pool.execute<AlbumRow[] & RowDataPacket[]>(
    `SELECT id, title, artist, artist_id, genre_id, year, created_at, updated_at FROM albums WHERE id = ?`,
    [id],
  );
  const album = rows[0];
  if (!album) return null;
  const [songs] = await pool.execute<SongRow[] & RowDataPacket[]>(
    `SELECT id, album_id, title, duration_seconds, position, created_at, updated_at FROM songs WHERE album_id = ? ORDER BY position ASC, id ASC`,
    [id],
  );
  return { ...album, songs };
}

export async function createAlbum(data: {
  title: string;
  artist: string;
  year?: number | null;
}): Promise<AlbumRow> {
  const [res] = await pool.execute<ResultSetHeader>(
    `INSERT INTO albums (title, artist, year) VALUES (?, ?, ?)`,
    [data.title, data.artist, data.year ?? null],
  );
  const id = res.insertId;
  const created = await getAlbum(id);
  if (!created) throw new Error("No se pudo leer el álbum recién creado");
  await syncAlbumToMongo(id);
  const { songs: _, ...album } = created;
  return album;
}

export async function updateAlbum(
  id: number,
  data: { title?: string; artist?: string; year?: number | null },
): Promise<(AlbumRow & { songs: SongRow[] }) | null> {
  const updates: string[] = [];
  const vals: SqlParam[] = [];
  if (data.title !== undefined) {
    updates.push("title = ?");
    vals.push(data.title);
  }
  if (data.artist !== undefined) {
    updates.push("artist = ?");
    vals.push(data.artist);
  }
  if (data.year !== undefined) {
    updates.push("year = ?");
    vals.push(data.year);
  }
  if (updates.length === 0) return getAlbum(id);
  vals.push(id);
  await pool.execute(`UPDATE albums SET ${updates.join(", ")} WHERE id = ?`, vals as SqlParam[]);
  const updated = await getAlbum(id);
  if (updated) await syncAlbumToMongo(id);
  return updated;
}

export async function deleteAlbum(id: number): Promise<boolean> {
  const [res] = await pool.execute<ResultSetHeader>(`DELETE FROM albums WHERE id = ?`, [id]);
  const ok = res.affectedRows > 0;
  if (ok) await deleteAlbumMongo(id);
  return ok;
}

export async function listSongs(albumId: number): Promise<SongRow[]> {
  const [rows] = await pool.execute<SongRow[] & RowDataPacket[]>(
    `SELECT id, album_id, title, duration_seconds, position, created_at, updated_at FROM songs WHERE album_id = ? ORDER BY position ASC, id ASC`,
    [albumId],
  );
  return rows;
}

export async function createSong(
  albumId: number,
  data: { title: string; duration_seconds?: number; position?: number },
): Promise<SongRow | null> {
  const [check] = await pool.execute<RowDataPacket[]>(
    `SELECT id FROM albums WHERE id = ? LIMIT 1`,
    [albumId],
  );
  if (check.length === 0) return null;
  const [res] = await pool.execute<ResultSetHeader>(
    `INSERT INTO songs (album_id, title, duration_seconds, position) VALUES (?, ?, ?, ?)`,
    [albumId, data.title, data.duration_seconds ?? 0, data.position ?? 0],
  );
  const id = res.insertId;
  const [songRows] = await pool.execute<SongRow[] & RowDataPacket[]>(
    `SELECT id, album_id, title, duration_seconds, position, created_at, updated_at FROM songs WHERE id = ?`,
    [id],
  );
  const song = songRows[0];
  await syncAlbumToMongo(albumId);
  return song ?? null;
}

export async function getSong(id: number): Promise<SongRow | null> {
  const [rows] = await pool.execute<SongRow[] & RowDataPacket[]>(
    `SELECT id, album_id, title, duration_seconds, position, created_at, updated_at FROM songs WHERE id = ?`,
    [id],
  );
  return rows[0] ?? null;
}

export async function updateSong(
  id: number,
  data: { title?: string; duration_seconds?: number; position?: number },
): Promise<SongRow | null> {
  const current = await getSong(id);
  if (!current) return null;
  const updates: string[] = [];
  const vals: SqlParam[] = [];
  if (data.title !== undefined) {
    updates.push("title = ?");
    vals.push(data.title);
  }
  if (data.duration_seconds !== undefined) {
    updates.push("duration_seconds = ?");
    vals.push(data.duration_seconds);
  }
  if (data.position !== undefined) {
    updates.push("position = ?");
    vals.push(data.position);
  }
  if (updates.length === 0) return current;
  vals.push(id);
  await pool.execute(`UPDATE songs SET ${updates.join(", ")} WHERE id = ?`, vals as SqlParam[]);
  const next = await getSong(id);
  if (next) await syncAlbumToMongo(next.album_id);
  return next;
}

export async function deleteSong(id: number): Promise<boolean> {
  const current = await getSong(id);
  if (!current) return false;
  const [res] = await pool.execute<ResultSetHeader>(`DELETE FROM songs WHERE id = ?`, [id]);
  const ok = res.affectedRows > 0;
  if (ok) await syncAlbumToMongo(current.album_id);
  return ok;
}

/** Vista denormalizada en Mongo (solo lectura desde API si quieres comparar tiendas). */
export async function getMongoSnapshot(albumMysqlId: number) {
  return AlbumMongo.findOne({ mysqlAlbumId: albumMysqlId }).lean().exec();
}
