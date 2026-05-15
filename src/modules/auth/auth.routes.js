import { Router } from "express";

import { login, logout, me, refresh } from "./auth.controller.js";
import { validate } from "../../middlewares/validate.middleware.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { loginSchema, logoutSchema, refreshSchema } from "./auth.validator.js";

const router = Router();

router.post("/login", validate(loginSchema), login);
router.post("/refresh", validate(refreshSchema), refresh);
router.get("/me", authMiddleware, me);
router.post("/logout", authMiddleware, validate(logoutSchema), logout);

export default router;
