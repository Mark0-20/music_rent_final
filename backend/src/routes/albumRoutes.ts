import { Router } from "express";
import {
  createAlbum,
  createSong,
  deleteAlbum,
  getAlbum,
  getMongoSnapshot,
  listAlbums,
  listSongs,
  updateAlbum,
} from "../services/musicService.js";

export const albumRouter = Router();

albumRouter.get("/", async (_req, res, next) => {
  try {
    const albums = await listAlbums();
    res.json(albums);
  } catch (e) {
    next(e);
  }
});

albumRouter.post("/", async (req, res, next) => {
  try {
    const { title, artist, year } = req.body as {
      title?: string;
      artist?: string;
      year?: number | null;
    };
    if (!title?.trim() || !artist?.trim()) {
      res.status(400).json({ error: "title y artist son obligatorios" });
      return;
    }
    const album = await createAlbum({ title: title.trim(), artist: artist.trim(), year });
    res.status(201).json(album);
  } catch (e) {
    next(e);
  }
});

albumRouter.get("/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      res.status(400).json({ error: "id inválido" });
      return;
    }
    const album = await getAlbum(id);
    if (!album) {
      res.status(404).json({ error: "Álbum no encontrado" });
      return;
    }
    res.json(album);
  } catch (e) {
    next(e);
  }
});

albumRouter.get("/:id/mongo-doc", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      res.status(400).json({ error: "id inválido" });
      return;
    }
    const doc = await getMongoSnapshot(id);
    if (!doc) {
      res.status(404).json({ error: "No hay copia en Mongo para este álbum" });
      return;
    }
    res.json(doc);
  } catch (e) {
    next(e);
  }
});

albumRouter.patch("/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      res.status(400).json({ error: "id inválido" });
      return;
    }
    const { title, artist, year } = req.body as {
      title?: string;
      artist?: string;
      year?: number | null;
    };
    const updated = await updateAlbum(id, { title, artist, year });
    if (!updated) {
      res.status(404).json({ error: "Álbum no encontrado" });
      return;
    }
    res.json(updated);
  } catch (e) {
    next(e);
  }
});

albumRouter.delete("/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      res.status(400).json({ error: "id inválido" });
      return;
    }
    const ok = await deleteAlbum(id);
    if (!ok) {
      res.status(404).json({ error: "Álbum no encontrado" });
      return;
    }
    res.status(204).send();
  } catch (e) {
    next(e);
  }
});

albumRouter.get("/:albumId/songs", async (req, res, next) => {
  try {
    const albumId = Number(req.params.albumId);
    if (Number.isNaN(albumId)) {
      res.status(400).json({ error: "albumId inválido" });
      return;
    }
    const parent = await getAlbum(albumId);
    if (!parent) {
      res.status(404).json({ error: "Álbum no encontrado" });
      return;
    }
    const songs = await listSongs(albumId);
    res.json(songs);
  } catch (e) {
    next(e);
  }
});

albumRouter.post("/:albumId/songs", async (req, res, next) => {
  try {
    const albumId = Number(req.params.albumId);
    if (Number.isNaN(albumId)) {
      res.status(400).json({ error: "albumId inválido" });
      return;
    }
    const { title, duration_seconds, position } = req.body as {
      title?: string;
      duration_seconds?: number;
      position?: number;
    };
    if (!title?.trim()) {
      res.status(400).json({ error: "title es obligatorio" });
      return;
    }
    const song = await createSong(albumId, {
      title: title.trim(),
      duration_seconds,
      position,
    });
    if (!song) {
      res.status(404).json({ error: "Álbum no encontrado" });
      return;
    }
    res.status(201).json(song);
  } catch (e) {
    next(e);
  }
});
