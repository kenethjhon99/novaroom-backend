import assert from "node:assert/strict";
import test from "node:test";

import { assertPlanLimit, getEmpresaLimites } from "../src/utils/planLimits.js";

test("assertPlanLimit rejects when the company reaches its plan cap", async () => {
  const calls = [];
  const client = {
    query: async (sql) => {
      calls.push(sql);

      if (sql.includes("information_schema.columns")) {
        return {
          rows: [
            { column_name: "max_modulos" },
            { column_name: "max_api_keys" },
          ],
        };
      }

      if (sql.includes("Empresa_limite")) {
        return {
          rows: [
            {
              max_sucursales: 1,
              max_habitaciones: 20,
              max_usuarios: 5,
              max_roles: 3,
              max_modulos: 10,
              max_api_keys: 0,
            },
          ],
        };
      }

      return { rows: [{ total: 1 }] };
    },
  };

  await assert.rejects(
    () =>
      assertPlanLimit({
        client,
        id_empresa: 1,
        limitKey: "max_sucursales",
        countQuery: "SELECT COUNT(*)::int AS total FROM test",
      }),
    (error) => {
      assert.equal(error.statusCode, 403);
      assert.equal(error.code, "PLAN_LIMIT_REACHED");
      assert.equal(error.details.allowed, 1);
      assert.equal(error.details.current, 1);
      return true;
    }
  );

  assert.equal(calls.length, 3);
});

test("assertPlanLimit allows creation below plan cap", async () => {
  const client = {
    query: async (sql) => {
      if (sql.includes("information_schema.columns")) {
        return {
          rows: [
            { column_name: "max_modulos" },
            { column_name: "max_api_keys" },
          ],
        };
      }

      if (sql.includes("Empresa_limite")) {
        return {
          rows: [
            {
              max_sucursales: 2,
              max_habitaciones: 20,
              max_usuarios: 5,
              max_roles: 3,
              max_modulos: 10,
              max_api_keys: 0,
            },
          ],
        };
      }

      return { rows: [{ total: 1 }] };
    },
  };

  const result = await assertPlanLimit({
    client,
    id_empresa: 1,
    limitKey: "max_sucursales",
    countQuery: "SELECT COUNT(*)::int AS total FROM test",
  });

  assert.equal(result.total, 1);
  assert.equal(result.limite, 2);
});

test("getEmpresaLimites uses defaults when newer limit columns do not exist", async () => {
  const client = {
    query: async (sql) => {
      if (sql.includes("information_schema.columns")) {
        return { rows: [] };
      }

      assert.match(sql, /999 AS max_modulos/);
      assert.match(sql, /0 AS max_api_keys/);

      return {
        rows: [
          {
            max_sucursales: 1,
            max_habitaciones: 20,
            max_usuarios: 5,
            max_roles: 3,
            almacenamiento_gb: 5,
            permite_bd_exclusiva: false,
            permite_dominio_propio: false,
            permite_api_externa: false,
            permite_offline: false,
            max_modulos: 999,
            max_api_keys: 0,
          },
        ],
      };
    },
  };

  const limites = await getEmpresaLimites(client, 1);

  assert.equal(limites.max_modulos, 999);
  assert.equal(limites.max_api_keys, 0);
});
