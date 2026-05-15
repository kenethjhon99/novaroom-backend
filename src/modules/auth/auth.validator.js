import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Email invalido"),
  password: z.string().min(1, "La contrasena es obligatoria"),
});

export const refreshSchema = z.object({
  refresh_token: z.string().min(20, "Refresh token obligatorio"),
});

export const logoutSchema = z.object({
  refresh_token: z.string().optional().nullable(),
});
