const baseUrl = (process.env.SMOKE_BASE_URL || "http://localhost:3000/api/v1").replace(/\/$/, "");
const email = process.env.SMOKE_EMAIL || "";
const password = process.env.SMOKE_PASSWORD || "";

const checks = [];

const check = async (name, fn) => {
  const startedAt = Date.now();

  try {
    await fn();
    checks.push({ name, ok: true, ms: Date.now() - startedAt });
  } catch (error) {
    checks.push({
      name,
      ok: false,
      ms: Date.now() - startedAt,
      error: error.message,
    });
  }
};

const requestJson = async (path, options = {}) => {
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      "content-type": "application/json",
      ...(options.headers || {}),
    },
  });
  const body = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(`${response.status} ${body?.message || response.statusText}`);
  }

  return body?.data ?? body;
};

await check("live", async () => {
  await requestJson("/live");
});

await check("ready", async () => {
  await requestJson("/ready");
});

await check("database", async () => {
  await requestJson("/health/db");
});

if (email && password) {
  let token;
  let refreshToken;

  await check("login", async () => {
    const session = await requestJson("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });

    token = session.token;
    refreshToken = session.refreshToken;

    if (!token || !refreshToken) {
      throw new Error("Login did not return access and refresh tokens");
    }
  });

  await check("auth me", async () => {
    await requestJson("/auth/me", {
      headers: { authorization: `Bearer ${token}` },
    });
  });

  await check("refresh", async () => {
    const session = await requestJson("/auth/refresh", {
      method: "POST",
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    token = session.token;
    refreshToken = session.refreshToken;

    if (!token || !refreshToken) {
      throw new Error("Refresh did not return new tokens");
    }
  });

  await check("logout", async () => {
    await requestJson("/auth/logout", {
      method: "POST",
      headers: { authorization: `Bearer ${token}` },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
  });
}

for (const result of checks) {
  const status = result.ok ? "PASS" : "FAIL";
  const suffix = result.ok ? "" : ` - ${result.error}`;
  console.log(`${status} ${result.name} (${result.ms}ms)${suffix}`);
}

const failed = checks.filter((result) => !result.ok);

if (failed.length) {
  process.exit(1);
}
