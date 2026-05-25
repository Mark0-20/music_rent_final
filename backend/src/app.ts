import cors from "cors";
import express from "express";
import { requireAuth } from "./middleware/auth.js";
import { albumRouter } from "./routes/albumRoutes.js";
import { authRouter } from "./routes/authRoutes.js";
import { songRouter } from "./routes/songRoutes.js";

export const app = express();

app.use(
  cors({
    origin: true,
    credentials: false,
  }),
);
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.use("/api/auth", authRouter);
app.use("/api", requireAuth);
app.use("/api/albums", albumRouter);
app.use("/api/songs", songRouter);

app.use(
  (
    err: unknown,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    console.error(err);
    res.status(500).json({ error: "Error interno del servidor" });
  },
);
