import { useCallback, useEffect, useMemo, useState } from "react";
import { api, setAuthToken } from "./api";
import type { Album, AuthUser, Song } from "./types";

function formatDur(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function App() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loginForm, setLoginForm] = useState({
    email: "admin@musicrent.local",
    password: "admin123",
  });
  const [albums, setAlbums] = useState<Album[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [detailedAlbum, setDetailedAlbum] = useState<Album | null>(null);
  const [mongoSnippet, setMongoSnippet] = useState<string | null>(null);
  console.log(mongoSnippet);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [newAlbum, setNewAlbum] = useState({ title: "", artist: "", year: "" });
  const [editAlbum, setEditAlbum] = useState({ title: "", artist: "", year: "" });
  const [newSong, setNewSong] = useState({
    title: "",
    duration_seconds: "180",
    position: "0",
  });
  const [editingSong, setEditingSong] = useState<Song | null>(null);

  const reloadAlbums = useCallback(async () => {
    const list = await api.albums();
    setAlbums(list);
    return list;
  }, []);

  async function refreshDetail(id: number) {
    const full = await api.album(id);
    setDetailedAlbum(full);
    try {
      const doc = await api.mongoDoc(id);
      setMongoSnippet(JSON.stringify(doc, null, 2));
    } catch {
      setMongoSnippet(null);
    }
  }

  useEffect(() => {
    api.me()
      .then(setUser)
      .catch(() => setAuthToken(""));
  }, []);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    reloadAlbums()
      .catch((e: Error) => setErr(e.message))
      .finally(() => setLoading(false));
  }, [reloadAlbums, user]);

  const selectedAlbum = useMemo(
    () => albums.find((a) => a.id === selectedId) ?? null,
    [albums, selectedId],
  );

  useEffect(() => {
    if (!selectedId || !user) {
      setDetailedAlbum(null);
      setMongoSnippet(null);
      return;
    }
    setLoading(true);
    refreshDetail(selectedId)
      .catch((e: Error) => setErr(e.message))
      .finally(() => setLoading(false));
  }, [selectedId, user]);

  useEffect(() => {
    if (!detailedAlbum) return;
    setEditAlbum({
      title: detailedAlbum.title,
      artist: detailedAlbum.artist,
      year: detailedAlbum.year?.toString() ?? "",
    });
  }, [detailedAlbum]);

  async function onLogin(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      const session = await api.login({
        email: loginForm.email.trim(),
        password: loginForm.password,
      });
      setUser(session.user);
    } catch (error) {
      setErr(error instanceof Error ? error.message : "Error");
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    setAuthToken("");
    setUser(null);
    setAlbums([]);
    setSelectedId(null);
  }

  async function onCreateAlbum(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      await api.createAlbum({
        title: newAlbum.title.trim(),
        artist: newAlbum.artist.trim(),
        year: newAlbum.year.trim() ? Number(newAlbum.year) : null,
      });
      setNewAlbum({ title: "", artist: "", year: "" });
      await reloadAlbums();
    } catch (error) {
      setErr(error instanceof Error ? error.message : "Error");
    } finally {
      setLoading(false);
    }
  }

  async function onSaveAlbumPatch(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedId) return;
    setErr(null);
    setLoading(true);
    try {
      await api.patchAlbum(selectedId, {
        title: editAlbum.title.trim(),
        artist: editAlbum.artist.trim(),
        year: editAlbum.year.trim() ? Number(editAlbum.year) : null,
      });
      await reloadAlbums();
      await refreshDetail(selectedId);
    } catch (error) {
      setErr(error instanceof Error ? error.message : "Error");
    } finally {
      setLoading(false);
    }
  }

  async function onDeleteAlbum() {
    if (!selectedId || !confirm("Borrar album y todas sus canciones?")) return;
    setErr(null);
    setLoading(true);
    try {
      await api.deleteAlbum(selectedId);
      setSelectedId(null);
      await reloadAlbums();
    } catch (error) {
      setErr(error instanceof Error ? error.message : "Error");
    } finally {
      setLoading(false);
    }
  }

  async function onCreateSong(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedId) return;
    setErr(null);
    setLoading(true);
    try {
      await api.createSong(selectedId, {
        title: newSong.title.trim(),
        duration_seconds: Number(newSong.duration_seconds) || 0,
        position: Number(newSong.position) || 0,
      });
      setNewSong({ title: "", duration_seconds: "180", position: "0" });
      await refreshDetail(selectedId);
      await reloadAlbums();
    } catch (error) {
      setErr(error instanceof Error ? error.message : "Error");
    } finally {
      setLoading(false);
    }
  }

  async function onSaveSong() {
    if (!editingSong) return;
    setErr(null);
    setLoading(true);
    try {
      await api.patchSong(editingSong.id, {
        title: editingSong.title.trim(),
        duration_seconds: editingSong.duration_seconds,
        position: editingSong.position,
      });
      setEditingSong(null);
      if (selectedId) await refreshDetail(selectedId);
    } catch (error) {
      setErr(error instanceof Error ? error.message : "Error");
    } finally {
      setLoading(false);
    }
  }

  async function onDeleteSong(songId: number) {
    if (!confirm("Borrar cancion?")) return;
    setErr(null);
    setLoading(true);
    try {
      await api.deleteSong(songId);
      setEditingSong(null);
      if (selectedId) await refreshDetail(selectedId);
    } catch (error) {
      setErr(error instanceof Error ? error.message : "Error");
    } finally {
      setLoading(false);
    }
  }

  const songs = detailedAlbum?.songs ?? [];

  return (
    <div className="layout">
      <header className="site-header">
        <h1 className="site-title">
          <img className="site-logo" src="/music-rent-logo.png" alt="Music RENT" />
        </h1>
        {user ? (
          <div className="auth-bar">
            <span>
              {user.name} ({user.role})
            </span>
            <button type="button" className="btn btn-ghost btn-sm" onClick={logout}>
              Salir
            </button>
          </div>
        ) : null}
      </header>

      {err ? <p className="error">{err}</p> : null}

      {!user ? (
        <section className="card login-card">
          <h2>Iniciar sesion</h2>
          <form className="row" onSubmit={onLogin}>
            <label>
              Email
              <input
                type="email"
                required
                value={loginForm.email}
                onChange={(e) => setLoginForm((p) => ({ ...p, email: e.target.value }))}
              />
            </label>
            <label>
              Password
              <input
                type="password"
                required
                value={loginForm.password}
                onChange={(e) => setLoginForm((p) => ({ ...p, password: e.target.value }))}
              />
            </label>
            <button className="btn btn-primary" type="submit" disabled={loading}>
              Entrar
            </button>
          </form>
        </section>
      ) : (
        <div className="panels">
          <section className="card">
            <h2>Nuevo album</h2>
            <form className="row" onSubmit={onCreateAlbum}>
              <label>
                Titulo
                <input
                  required
                  value={newAlbum.title}
                  onChange={(e) => setNewAlbum((p) => ({ ...p, title: e.target.value }))}
                />
              </label>
              <label>
                Artista
                <input
                  required
                  value={newAlbum.artist}
                  onChange={(e) => setNewAlbum((p) => ({ ...p, artist: e.target.value }))}
                />
              </label>
              <label>
                Anio
                <input
                  placeholder="Opcional"
                  value={newAlbum.year}
                  onChange={(e) => setNewAlbum((p) => ({ ...p, year: e.target.value }))}
                />
              </label>
              <button className="btn btn-primary" type="submit" disabled={loading}>
                Crear album
              </button>
            </form>

            <h2 style={{ marginTop: "1.25rem" }}>Albumes</h2>
            {albums.length === 0 && !loading ? (
              <p className="empty">No hay albumes.</p>
            ) : (
              <ul className="albums">
                {albums.map((a) => (
                  <li key={a.id} className={`album-li ${selectedId === a.id ? "selected" : ""}`}>
                    <button type="button" className="select" onClick={() => setSelectedId(a.id)}>
                      <strong>{a.title}</strong>
                      <span className="meta">
                        {a.artist}
                        {a.year != null ? ` - ${a.year}` : ""}{" "}
                        {typeof a.songs?.length === "number" ? `- ${a.songs.length} canc.` : ""}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="card songs-panel">
            {!selectedAlbum ? (
              <p className="empty">Selecciona un album para ver y editar canciones.</p>
            ) : (
              <>
                <div className="toolbar">
                  <strong>
                    {selectedAlbum.title} - {selectedAlbum.artist}
                  </strong>
                  <button type="button" className="btn btn-danger btn-sm" onClick={onDeleteAlbum}>
                    Borrar album
                  </button>
                </div>

                <h2>Editar album</h2>
                <form className="row" onSubmit={onSaveAlbumPatch}>
                  <label>
                    Titulo
                    <input
                      required
                      value={editAlbum.title}
                      onChange={(e) => setEditAlbum((p) => ({ ...p, title: e.target.value }))}
                    />
                  </label>
                  <label>
                    Artista
                    <input
                      required
                      value={editAlbum.artist}
                      onChange={(e) => setEditAlbum((p) => ({ ...p, artist: e.target.value }))}
                    />
                  </label>
                  <label>
                    Anio
                    <input
                      value={editAlbum.year}
                      onChange={(e) => setEditAlbum((p) => ({ ...p, year: e.target.value }))}
                    />
                  </label>
                  <button className="btn btn-primary" type="submit" disabled={loading}>
                    Guardar album
                  </button>
                </form>

                <h2 style={{ marginTop: "1rem" }}>Nueva cancion</h2>
                <form className="row" onSubmit={onCreateSong}>
                  <label>
                    Titulo
                    <input
                      required
                      value={newSong.title}
                      onChange={(e) => setNewSong((p) => ({ ...p, title: e.target.value }))}
                    />
                  </label>
                  <label>
                    Duracion (seg.)
                    <input
                      type="number"
                      min={0}
                      value={newSong.duration_seconds}
                      onChange={(e) =>
                        setNewSong((p) => ({ ...p, duration_seconds: e.target.value }))
                      }
                    />
                  </label>
                  <label>
                    Orden
                    <input
                      type="number"
                      min={0}
                      value={newSong.position}
                      onChange={(e) => setNewSong((p) => ({ ...p, position: e.target.value }))}
                    />
                  </label>
                  <button className="btn btn-primary" type="submit" disabled={loading}>
                    Anadir cancion
                  </button>
                </form>

                <h2 style={{ marginTop: "1.25rem" }}>Canciones</h2>
                <table>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Titulo</th>
                      <th>Duracion</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {songs.map((s) =>
                      editingSong?.id === s.id ? (
                        <tr key={s.id} className="editing">
                          <td>
                            <input
                              style={{ width: "3rem" }}
                              type="number"
                              min={0}
                              value={editingSong.position}
                              onChange={(e) =>
                                setEditingSong((prev) =>
                                  prev ? { ...prev, position: Number(e.target.value) } : null,
                                )
                              }
                            />
                          </td>
                          <td>
                            <input
                              style={{ width: "100%", minWidth: "120px" }}
                              value={editingSong.title}
                              onChange={(e) =>
                                setEditingSong((prev) =>
                                  prev ? { ...prev, title: e.target.value } : null,
                                )
                              }
                            />
                          </td>
                          <td>
                            <input
                              style={{ width: "4.5rem" }}
                              type="number"
                              min={0}
                              value={editingSong.duration_seconds}
                              onChange={(e) =>
                                setEditingSong((prev) =>
                                  prev
                                    ? { ...prev, duration_seconds: Number(e.target.value) }
                                    : null,
                                )
                              }
                            />
                          </td>
                          <td>
                            <button
                              type="button"
                              className="btn btn-primary btn-sm"
                              onClick={onSaveSong}
                            >
                              OK
                            </button>{" "}
                            <button
                              type="button"
                              className="btn btn-ghost btn-sm"
                              onClick={() => setEditingSong(null)}
                            >
                              X
                            </button>
                          </td>
                        </tr>
                      ) : (
                        <tr key={s.id}>
                          <td>{s.position}</td>
                          <td>{s.title}</td>
                          <td>{formatDur(s.duration_seconds)}</td>
                          <td>
                            <button
                              type="button"
                              className="btn btn-ghost btn-sm"
                              onClick={() => setEditingSong({ ...s })}
                            >
                              Editar
                            </button>{" "}
                            <button
                              type="button"
                              className="btn btn-danger btn-sm"
                              onClick={() => onDeleteSong(s.id)}
                            >
                              Borrar
                            </button>
                          </td>
                        </tr>
                      ),
                    )}
                  </tbody>
                </table>
                {songs.length === 0 && <p className="empty">Sin canciones todavia.</p>}


              </>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
