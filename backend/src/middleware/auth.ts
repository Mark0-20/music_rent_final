import type { NextFunction, Request, Response } from "express";
import { getBearerToken, verifyToken, type AuthUser } from "../services/authService.js";

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = getBearerToken(req);
  const user = token ? verifyToken(token) : null;
  if (!user) {
    res.status(401).json({ error: "Sesion requerida" });
    return;
  }
  req.user = user;
  next();
}
