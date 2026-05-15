import { AppError } from "../utils/AppError.js";

const buckets = new Map();

export const rateLimitMiddleware = ({
  windowMs = 15 * 60 * 1000,
  max = 300,
} = {}) => {
  return (req, res, next) => {
    const key = req.ip || req.socket?.remoteAddress || "unknown";
    const now = Date.now();
    const bucket = buckets.get(key) || { count: 0, resetAt: now + windowMs };

    if (bucket.resetAt <= now) {
      bucket.count = 0;
      bucket.resetAt = now + windowMs;
    }

    bucket.count += 1;
    buckets.set(key, bucket);

    if (bucket.count > max) {
      throw new AppError(
        "Demasiadas solicitudes. Intenta de nuevo mas tarde.",
        429,
        null,
        "RATE_LIMIT_EXCEEDED"
      );
    }

    next();
  };
};
