export const openApiDocument = {
  openapi: "3.0.3",
  info: {
    title: "NovaRoom API",
    version: "1.0.0",
    description: "API-first backend para NovaRoom SaaS multitenant.",
  },
  servers: [
    {
      url: "/api/v1",
      description: "API v1",
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
      apiKeyAuth: {
        type: "apiKey",
        in: "header",
        name: "x-api-key",
      },
    },
    schemas: {
      ApiResponse: {
        type: "object",
        properties: {
          success: { type: "boolean" },
          message: { type: "string" },
          data: {},
          error: {
            type: "object",
            nullable: true,
            properties: {
              code: { type: "string" },
              details: {},
            },
          },
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
  paths: {
    "/health": {
      get: {
        tags: ["Sistema"],
        summary: "Verifica salud de la API",
        responses: { 200: { description: "API saludable" } },
      },
    },
    "/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "Inicia sesion",
        responses: { 200: { description: "Sesion iniciada" } },
      },
    },
    "/auth/me": {
      get: {
        tags: ["Auth"],
        summary: "Obtiene usuario, roles, permisos, modulos y limites",
        responses: { 200: { description: "Contexto autenticado" } },
      },
    },
    "/auth/logout": {
      post: {
        tags: ["Auth"],
        summary: "Cierra sesion y revoca sesion actual",
        responses: { 200: { description: "Sesion cerrada" } },
      },
    },
    "/me/contexto": {
      get: {
        tags: ["Contexto"],
        summary: "Obtiene contexto operativo actual",
        responses: { 200: { description: "Contexto operativo" } },
      },
    },
    "/me/sucursal-activa": {
      patch: {
        tags: ["Contexto"],
        summary: "Valida cambio de sucursal activa",
        responses: { 200: { description: "Sucursal activa validada" } },
      },
    },
    "/empresas": {
      get: { tags: ["SaaS"], summary: "Lista empresas", responses: { 200: { description: "OK" } } },
      post: { tags: ["SaaS"], summary: "Crea empresa completa", responses: { 201: { description: "Creada" } } },
    },
    "/sucursales": {
      get: { tags: ["SaaS"], summary: "Lista sucursales", responses: { 200: { description: "OK" } } },
      post: { tags: ["SaaS"], summary: "Crea sucursal", responses: { 201: { description: "Creada" } } },
    },
    "/usuarios": {
      get: { tags: ["Seguridad"], summary: "Lista usuarios", responses: { 200: { description: "OK" } } },
      post: { tags: ["Seguridad"], summary: "Crea usuario", responses: { 201: { description: "Creado" } } },
    },
    "/roles": {
      get: { tags: ["Seguridad"], summary: "Lista roles", responses: { 200: { description: "OK" } } },
      post: { tags: ["Seguridad"], summary: "Crea rol", responses: { 201: { description: "Creado" } } },
    },
    "/permisos": {
      get: { tags: ["Seguridad"], summary: "Lista permisos", responses: { 200: { description: "OK" } } },
    },
    "/modulos": {
      get: { tags: ["SaaS"], summary: "Lista modulos", responses: { 200: { description: "OK" } } },
    },
    "/planes": {
      get: { tags: ["SaaS Comercial"], summary: "Lista planes", responses: { 200: { description: "OK" } } },
      post: { tags: ["SaaS Comercial"], summary: "Crea plan", responses: { 201: { description: "Creado" } } },
    },
    "/licencias": {
      get: { tags: ["SaaS Comercial"], summary: "Lista licencias", responses: { 200: { description: "OK" } } },
      post: { tags: ["SaaS Comercial"], summary: "Crea licencia", responses: { 201: { description: "Creada" } } },
    },
    "/suscripciones": {
      get: { tags: ["SaaS Comercial"], summary: "Lista suscripciones", responses: { 200: { description: "OK" } } },
      post: { tags: ["SaaS Comercial"], summary: "Crea suscripcion", responses: { 201: { description: "Creada" } } },
    },
    "/habitaciones": {
      get: { tags: ["Operacion"], summary: "Lista habitaciones", responses: { 200: { description: "OK" } } },
      post: { tags: ["Operacion"], summary: "Crea habitacion", responses: { 201: { description: "Creada" } } },
    },
    "/reservas": {
      get: { tags: ["Operacion"], summary: "Lista reservas", responses: { 200: { description: "OK" } } },
      post: { tags: ["Operacion"], summary: "Crea reserva", responses: { 201: { description: "Creada" } } },
    },
    "/caja/actual": {
      get: { tags: ["Operacion"], summary: "Obtiene caja abierta", responses: { 200: { description: "OK" } } },
    },
    "/auditoria": {
      get: { tags: ["Auditoria"], summary: "Lista eventos de auditoria", responses: { 200: { description: "OK" } } },
    },
    "/api-keys": {
      get: { tags: ["Integraciones"], summary: "Lista API keys", responses: { 200: { description: "OK" } } },
      post: { tags: ["Integraciones"], summary: "Crea API key", responses: { 201: { description: "Creada" } } },
    },
    "/webhooks": {
      get: { tags: ["Integraciones"], summary: "Lista webhooks", responses: { 200: { description: "OK" } } },
      post: { tags: ["Integraciones"], summary: "Crea webhook", responses: { 201: { description: "Creado" } } },
    },
    "/webhooks/logs/entregas": {
      get: { tags: ["Integraciones"], summary: "Lista logs de entregas webhook", responses: { 200: { description: "OK" } } },
    },
    "/dominios": {
      get: { tags: ["Enterprise"], summary: "Lista dominios personalizados", responses: { 200: { description: "OK" } } },
      post: { tags: ["Enterprise"], summary: "Registra dominio personalizado", responses: { 201: { description: "Creado" } } },
    },
    "/tenant-databases": {
      get: { tags: ["Enterprise"], summary: "Lista bases dedicadas", responses: { 200: { description: "OK" } } },
      post: { tags: ["Enterprise"], summary: "Registra base dedicada", responses: { 201: { description: "Creada" } } },
    },
  },
};
