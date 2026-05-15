import test from "node:test";
import assert from "node:assert/strict";

import { tenantMiddleware } from "../src/middlewares/tenant.middleware.js";

const runMiddleware = (req) => {
  return new Promise((resolve, reject) => {
    const result = tenantMiddleware(req, {}, (error) => {
      if (error) reject(error);
      else resolve(req);
    });

    if (result?.catch) {
      result.catch(reject);
    }
  });
};

test("tenantMiddleware binds regular users to their company", async () => {
  const req = {
    headers: {},
    query: {},
    body: {},
    user: {
      id_empresa: 10,
      id_sucursal: 20,
      tipo_usuario: "EMPRESA",
    },
  };

  await runMiddleware(req);

  assert.deepEqual(req.tenant, {
    id_empresa: 10,
    id_sucursal: 20,
    isSuperAdmin: false,
  });
});

test("tenantMiddleware rejects branch hopping", async () => {
  const req = {
    headers: {},
    query: { id_sucursal: "99" },
    body: {},
    user: {
      id_empresa: 10,
      id_sucursal: 20,
      tipo_usuario: "EMPRESA",
    },
  };

  await assert.rejects(() => runMiddleware(req), {
    code: "TENANT_BRANCH_FORBIDDEN",
  });
});

test("tenantMiddleware allows superadmin explicit context", async () => {
  const req = {
    headers: {
      "x-empresa-id": "10",
      "x-sucursal-id": "20",
    },
    query: {},
    body: {},
    user: {
      tipo_usuario: "SUPER_ADMIN",
    },
  };

  await runMiddleware(req);

  assert.deepEqual(req.tenant, {
    id_empresa: 10,
    id_sucursal: 20,
    isSuperAdmin: true,
  });
});
