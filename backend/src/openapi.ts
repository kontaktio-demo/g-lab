/**
 * Minimalistyczna specyfikacja OpenAPI 3.0 — wystarcza Swagger UI do wygenerowania
 * przeglądarki API z możliwością "Try it out". Trzymana w jednym pliku TS,
 * żeby nie żonglować generatorami.
 */
export const openapi = {
  openapi: '3.0.3',
  info: {
    title: 'G-Lab Backend API',
    version: '1.0.0',
    description:
      'REST API dla strony G-Lab + panelu admina. Konwersja obrazów (sharp → AVIF/WebP), zarządzanie realizacjami, katalogiem i zapytaniami z formularzy.',
  },
  servers: [{ url: '/' }],
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
    },
  },
  paths: {
    '/health': { get: { summary: 'Liveness', responses: { 200: { description: 'OK' } } } },
    '/health/ready': {
      get: { summary: 'Readiness (DB ping)', responses: { 200: { description: 'OK' }, 503: { description: 'DB unreachable' } } },
    },
    '/api/auth/login': {
      post: {
        summary: 'Login admina (e-mail + hasło) → JWT',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: { email: { type: 'string', format: 'email' }, password: { type: 'string' } },
              },
            },
          },
        },
        responses: { 200: { description: 'OK' }, 401: { description: 'Bad credentials' } },
      },
    },
    '/api/auth/me': {
      get: { summary: 'Aktualny user', security: [{ bearerAuth: [] }], responses: { 200: { description: 'OK' } } },
    },
    '/api/realizations': {
      get: {
        summary: 'Lista realizacji (publiczne, opublikowane)',
        parameters: [
          { name: 'marka', in: 'query', schema: { type: 'string' } },
          { name: 'usluga', in: 'query', schema: { type: 'string', enum: ['chiptuning', 'dpf-egr', 'hamownia', 'inne'] } },
          { name: 'rok', in: 'query', schema: { type: 'string' } },
          { name: 'q', in: 'query', schema: { type: 'string' } },
          { name: 'limit', in: 'query', schema: { type: 'integer', maximum: 100 } },
          { name: 'offset', in: 'query', schema: { type: 'integer' } },
        ],
        responses: { 200: { description: 'OK' } },
      },
      post: { summary: 'Dodaj realizację', security: [{ bearerAuth: [] }], responses: { 201: { description: 'Created' } } },
    },
    '/api/realizations/{slug}': {
      get: {
        summary: 'Pojedyncza realizacja po slug (publiczne)',
        parameters: [{ name: 'slug', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'OK' }, 404: { description: 'Not found' } },
      },
    },
    '/api/realizations/{id}': {
      put: {
        summary: 'Aktualizuj realizację',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: { 200: { description: 'OK' } },
      },
      delete: {
        summary: 'Usuń realizację (+ pliki ze Storage)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: { 200: { description: 'OK' } },
      },
    },
    '/api/catalog': { get: { summary: 'Katalog aut (publiczne, paginacja)', responses: { 200: { description: 'OK' } } } },
    '/api/catalog/import': {
      post: { summary: 'Bulk import katalogu (JSON)', security: [{ bearerAuth: [] }], responses: { 200: { description: 'OK' } } },
    },
    '/api/leads': {
      post: {
        summary: 'Wyślij zapytanie z formularza (publiczne, rate-limit, honeypot)',
        responses: { 201: { description: 'Created' } },
      },
      get: { summary: 'Lista zapytań (admin)', security: [{ bearerAuth: [] }], responses: { 200: { description: 'OK' } } },
    },
    '/api/leads/export.csv': {
      get: { summary: 'Eksport zapytań do CSV', security: [{ bearerAuth: [] }], responses: { 200: { description: 'OK' } } },
    },
    '/api/leads/{id}': {
      patch: { summary: 'Zmień status zapytania', security: [{ bearerAuth: [] }], responses: { 200: { description: 'OK' } } },
      delete: { summary: 'Usuń zapytanie', security: [{ bearerAuth: [] }], responses: { 200: { description: 'OK' } } },
    },
    '/api/leads/bulk': {
      post: { summary: 'Bulk-akcje (delete / set-status)', security: [{ bearerAuth: [] }], responses: { 200: { description: 'OK' } } },
    },
    '/api/uploads/image': {
      post: {
        summary: 'Upload pojedynczego obrazu (multipart). Backend → sharp → AVIF/WebP/JPG (3 szerokości) + LQIP + blurhash → Supabase Storage.',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                properties: {
                  file: { type: 'string', format: 'binary' },
                  folder: { type: 'string', enum: ['cover', 'gallery', 'misc'] },
                  alt: { type: 'string' },
                },
              },
            },
          },
        },
        responses: { 201: { description: 'Created' } },
      },
      delete: { summary: 'Usuń wszystkie warianty obrazu', security: [{ bearerAuth: [] }], responses: { 200: { description: 'OK' } } },
    },
    '/api/uploads/images': {
      post: { summary: 'Upload wielu obrazów (do 12) w polu "files"', security: [{ bearerAuth: [] }], responses: { 201: { description: 'Created' } } },
    },
    '/api/stats': { get: { summary: 'Statystyki pulpitu', security: [{ bearerAuth: [] }], responses: { 200: { description: 'OK' } } } },
  },
} as const;
