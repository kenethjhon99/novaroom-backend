import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

import { env } from "./config/env.js";
import { corsOriginDelegate } from "./config/cors.js";
import routes from "./routes/index.js";
import { errorMiddleware } from "./middlewares/error.middleware.js";
import { rateLimitMiddleware } from "./middlewares/rateLimit.middleware.js";
import { sanitizeMiddleware } from "./middlewares/sanitize.middleware.js";

const app = express();

app.use(helmet());
app.use(cors({ origin: corsOriginDelegate }));
app.use(express.json({ limit: env.payloadLimit }));
app.use(express.urlencoded({ extended: true }));
app.use(sanitizeMiddleware);
app.use(morgan("dev"));
app.use(rateLimitMiddleware(env.rateLimit));

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "NovaRoom ERP API funcionando correctamente",
  });
});

app.use("/api/v1", routes);
app.use("/api", routes);

app.use(errorMiddleware);

export default app;
