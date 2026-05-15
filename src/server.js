import http from "http";
import jwt from "jsonwebtoken";
import { Server } from "socket.io";

import app from "./app.js";
import { env } from "./config/env.js";
import { corsOriginDelegate } from "./config/cors.js";
import { pool } from "./config/db.js";
import { initSocket } from "./config/socket.js";
import { isSessionActive } from "./modules/auth/auth.model.js";

const getSocketToken = (socket) => {
  const authToken = socket.handshake.auth?.token;
  const header = socket.handshake.headers?.authorization;

  if (authToken) return authToken;

  if (header?.startsWith("Bearer ")) {
    return header.split(" ")[1];
  }

  return null;
};

const assertSucursalBelongsToEmpresa = async (id_sucursal, id_empresa) => {
  const result = await pool.query(
    `
    SELECT id_sucursal
    FROM "Sucursal"
    WHERE id_sucursal = $1
    AND id_empresa = $2
    AND estado = 'ACTIVA'
    AND deleted_at IS NULL
    LIMIT 1;
    `,
    [id_sucursal, id_empresa]
  );

  return Boolean(result.rows[0]);
};

const startServer = async () => {
  try {
    await pool.query("SELECT NOW()");
    console.log("Base de datos conectada correctamente");

    const httpServer = http.createServer(app);

    const io = new Server(httpServer, {
      cors: {
        origin: corsOriginDelegate,
        methods: ["GET", "POST", "PATCH", "DELETE"],
      },
    });

    io.use(async (socket, next) => {
      const token = getSocketToken(socket);

      if (!token) {
        return next(new Error("AUTH_TOKEN_MISSING"));
      }

      try {
        socket.user = jwt.verify(token, env.jwt.secret);
        socket.token = token;

        const active = await isSessionActive(token);

        if (!active) {
          return next(new Error("AUTH_SESSION_REVOKED"));
        }

        return next();
      } catch {
        return next(new Error("AUTH_INVALID_TOKEN"));
      }
    });

    initSocket(io);

    io.on("connection", (socket) => {
      const user = socket.user;

      if (user?.id_empresa) {
        socket.join(`empresa:${user.id_empresa}`);
      }

      if (user?.id_sucursal) {
        socket.join(`sucursal:${user.id_sucursal}`);
      }

      socket.on("join:empresa", (id_empresa) => {
        if (user?.tipo_usuario === "SUPER_ADMIN") {
          return;
        }

        if (Number(id_empresa) === Number(user?.id_empresa)) {
          socket.join(`empresa:${id_empresa}`);
        }
      });

      socket.on("join:sucursal", async (id_sucursal) => {
        if (user?.tipo_usuario === "SUPER_ADMIN") {
          return;
        }

        const requestedSucursal = Number(id_sucursal);
        const userSucursal = Number(user?.id_sucursal);

        if (userSucursal && requestedSucursal !== userSucursal) {
          return;
        }

        const allowed = await assertSucursalBelongsToEmpresa(
          requestedSucursal,
          user.id_empresa
        );

        if (allowed) {
          socket.join(`sucursal:${id_sucursal}`);
        }
      });
    });

    httpServer.listen(env.port, () => {
      console.log(`Servidor corriendo en puerto ${env.port}`);
    });
  } catch (error) {
    console.error("Error al iniciar servidor:", error);
    process.exit(1);
  }
};

startServer();
