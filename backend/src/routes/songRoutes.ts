import { Router } from "express";
import { deleteSong, getSong, updateSong } from "../services/musicService.js";

export const songRouter = Router();

songRouter.get("/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      res.status(400).json({ error: "id inválido" });
      return;
    }
    const song = await getSong(id);
    if (!song) {
      res.status(404).json({ error: "Canción no encontrada" });
      return;
    }
    res.json(song);
  } catch (e) {
    next(e);
  }
});

songRouter.patch("/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      res.status(400).json({ error: "id inválido" });
      return;
    }
    const { title, duration_seconds, position } = req.body as {
      title?: string;
      duration_seconds?: number;
      position?: number;
    };
    const song = await updateSong(id, { title, duration_seconds, position });
    if (!song) {
      res.status(404).json({ error: "Canción no encontrada" });
      return;
    }
    res.json(song);
  } catch (e) {
    next(e);
  }
});

songRouter.delete("/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      res.status(400).json({ error: "id inválido" });
      return;
    }
    const ok = await deleteSong(id);
    if (!ok) {
      res.status(404).json({ error: "Canción no encontrada" });
      return;
    }
    res.status(204).send();
  } catch (e) {
    next(e);
  }
});
