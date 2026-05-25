import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { login } from "../services/authService.js";

export const authRouter = Router();

authRouter.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body as { email?: string; password?: string };
    if (!email?.trim() || !password) {
      res.status(400).json({ error: "email y password son obligatorios" });
      return;
    }

    const session = await login(email.trim().toLowerCase(), password);
    if (!session) {
      res.status(401).json({ error: "Credenciales invalidas" });
      return;
    }
    res.json(session);
  } catch (e) {
    next(e);
  }
});

authRouter.get("/me", requireAuth, (req, res) => {
  res.json(req.user);
});
