import type { Album, AuthUser, Song } from "./types";

const base = ""; // mismo origen -> proxy Vite -> Express
let authToken = localStorage.getItem("music_rent_token") ?? "";

function headers(jsonBody = false): HeadersInit {
  return {
    ...(jsonBody ? { "Content-Type": "application/json" } : {}),
    ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
  };
}

export function setAuthToken(token: string) {
  authToken = token;
  if (token) localStorage.setItem("music_rent_token", token);
  else localStorage.removeItem("music_rent_token");
}

async function json<T>(res: Response): Promise<T> {
  if (res.status === 204) return undefined as T;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error ?? res.statusText);
  return data as T;
}

export const api = {
  async login(body: { email: string; password: string }): Promise<{ token: string; user: AuthUser }> {
    const r = await fetch(`${base}/api/auth/login`, {
      method: "POST",
      headers: headers(true),
      body: JSON.stringify(body),
    });
    const session = await json<{ token: string; user: AuthUser }>(r);
    setAuthToken(session.token);
    return session;
  },
  async me(): Promise<AuthUser> {
    const r = await fetch(`${base}/api/auth/me`, { headers: headers() });
    return json(r);
  },
  async albums(): Promise<Album[]> {
    const r = await fetch(`${base}/api/albums`, { headers: headers() });
    return json(r);
  },
  async album(id: number): Promise<Album> {
    const r = await fetch(`${base}/api/albums/${id}`, { headers: headers() });
    return json(r);
  },
  async mongoDoc(id: number): Promise<Record<string, unknown>> {
    const r = await fetch(`${base}/api/albums/${id}/mongo-doc`, { headers: headers() });
    return json(r);
  },
  async createAlbum(body: {
    title: string;
    artist: string;
    year?: number | null;
  }): Promise<Album> {
    const r = await fetch(`${base}/api/albums`, {
      method: "POST",
      headers: headers(true),
      body: JSON.stringify(body),
    });
    return json(r);
  },
  async patchAlbum(
    id: number,
    body: { title?: string; artist?: string; year?: number | null },
  ): Promise<Album> {
    const r = await fetch(`${base}/api/albums/${id}`, {
      method: "PATCH",
      headers: headers(true),
      body: JSON.stringify(body),
    });
    return json(r);
  },
  async deleteAlbum(id: number): Promise<void> {
    const r = await fetch(`${base}/api/albums/${id}`, { method: "DELETE", headers: headers() });
    await json(r);
  },
  async songs(albumId: number): Promise<Song[]> {
    const r = await fetch(`${base}/api/albums/${albumId}/songs`, { headers: headers() });
    return json(r);
  },
  async createSong(
    albumId: number,
    body: { title: string; duration_seconds?: number; position?: number },
  ): Promise<Song> {
    const r = await fetch(`${base}/api/albums/${albumId}/songs`, {
      method: "POST",
      headers: headers(true),
      body: JSON.stringify(body),
    });
    return json(r);
  },
  async patchSong(
    id: number,
    body: { title?: string; duration_seconds?: number; position?: number },
  ): Promise<Song> {
    const r = await fetch(`${base}/api/songs/${id}`, {
      method: "PATCH",
      headers: headers(true),
      body: JSON.stringify(body),
    });
    return json(r);
  },
  async deleteSong(id: number): Promise<void> {
    const r = await fetch(`${base}/api/songs/${id}`, { method: "DELETE", headers: headers() });
    await json(r);
  },
};
