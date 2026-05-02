# G-Lab Backend

REST API + image pipeline (sharp → AVIF/WebP/JPEG) dla całego ekosystemu G-Lab.
Jeden proces Node.js obsługuje:

- **Auth admina** (logowanie, refresh, /me) — opakowanie Supabase Auth.
- **CRUD realizacji** — z auto-triggerem rebuildu strony statycznej.
- **Katalog aut** — odczyt + bulk import.
- **Skrzynka zapytań (leads)** — formularze ze strony publicznej (kontakt, wycena), CSV export, bulk-akcje, powiadomienia SMTP.
- **Image pipeline** — JPEG/PNG/HEIC/WebP/AVIF/TIFF/GIF → 3 szerokości × 3 formaty (AVIF/WebP/JPEG fallback) + LQIP base64 + blurhash, upload do Supabase Storage, strip EXIF, auto-rotate.
- **Statystyki** dla pulpitu admina.
- **OpenAPI / Swagger UI** na `/api/docs`.

> Folder zaprojektowany jest tak, by **bez zmian** dało się go skopiować do osobnego repo i wdrożyć na Render — patrz `render.yaml`.

---

## 🧱 Stack

| | |
|---|---|
| Runtime | **Node.js 20+**, ESM |
| Framework | **Express 4** |
| Język | **TypeScript 5** (strict, NodeNext) |
| Walidacja | **zod** |
| Logger | **pino** + **pino-http** (structured JSON, request-id) |
| Bezpieczeństwo | **helmet**, **express-rate-limit**, CORS allowlist, file-type magic-bytes |
| Image pipeline | **sharp**, **blurhash** |
| DB / Auth / Storage | **Supabase** (`@supabase/supabase-js`) — service-role + auth-proxy |
| Mailer | **nodemailer** (opcjonalny SMTP) |
| Docs | **swagger-ui-express** + spec OpenAPI 3.0 |
| Test | **vitest** |
| Deploy | **Render** (Blueprint `render.yaml`) lub Docker |

---

## 🚀 Setup lokalny

```bash
cd backend
cp .env.example .env
# wypełnij .env (URL i klucze z supabase.com → Project Settings → API)
npm install
npm run dev
```

API wystartuje na <http://localhost:4000>:

- `GET  /` — info o serwisie
- `GET  /health` — liveness
- `GET  /health/ready` — readiness (ping do Supabase)
- `GET  /api/docs` — Swagger UI (możesz klikać "Try it out")
- `GET  /api/openapi.json` — surowa specyfikacja

### Wymagane ENV

Patrz [`.env.example`](./.env.example) — najważniejsze:

| Zmienna | Opis |
|---|---|
| `SUPABASE_URL` | `https://<projekt>.supabase.co` |
| `SUPABASE_ANON_KEY` | klucz publiczny (do walidacji JWT) |
| `SUPABASE_SERVICE_ROLE_KEY` | klucz tajny (operacje admina, omija RLS) — **nigdy nie w przeglądarce** |
| `SUPABASE_BUCKET` | bucket Storage (domyślnie `realizacje`) |
| `ALLOWED_ORIGINS` | lista domen po przecinku — strona publiczna + admin panel |

Opcjonalne:

- `SMTP_HOST/USER/PASS/FROM/TO` — powiadomienia o nowych zapytaniach.
- `REVALIDATE_HOOK_URL` — POST do build hooka Netlify/Vercel po edycji realizacji (auto-rebuild strony statycznej).

---

## 📡 Endpointy

### Publiczne (bez auth)

| Metoda | Ścieżka | Opis |
|---|---|---|
| GET  | `/api/realizations` | Lista opublikowanych. Filtry: `marka, usluga, rok, q, limit, offset`. |
| GET  | `/api/realizations/:slug` | Pojedyncza realizacja. |
| GET  | `/api/catalog` | Katalog aut. |
| POST | `/api/leads` | Wyślij zapytanie z formularza. **Rate-limit + honeypot**. |
| GET  | `/health`, `/health/ready` | Healthchecks. |

### Wymagają `Authorization: Bearer <JWT>`

| Metoda | Ścieżka | Opis |
|---|---|---|
| POST   | `/api/auth/login` | Logowanie e-mail+hasło → JWT (rate-limit 10/min). |
| POST   | `/api/auth/refresh` | Odświeżenie sesji. |
| POST   | `/api/auth/logout` | Wylogowanie. |
| GET    | `/api/auth/me` | Aktualny user. |
| POST/PUT/DELETE | `/api/realizations*` | Pełny CRUD. Po sukcesie triggeruje webhook revalidate. |
| POST   | `/api/catalog/import` | Bulk upsert/replace. |
| GET    | `/api/leads` | Skrzynka. Filtry `status, source, q, limit, offset`. |
| GET    | `/api/leads/export.csv` | Eksport CSV (UTF-8 BOM dla Excela). |
| PATCH  | `/api/leads/:id` | Zmiana statusu (`new\|in_progress\|done\|spam`). |
| DELETE | `/api/leads/:id` | Usunięcie. |
| POST   | `/api/leads/bulk` | Bulk: `delete` lub `set-status`. |
| POST   | `/api/uploads/image` | Single upload (multipart, pole `file`). Zwraca **wszystkie warianty** + LQIP + blurhash. |
| POST   | `/api/uploads/images` | Multi upload (do 12, pole `files`). |
| DELETE | `/api/uploads/image` | Usuwa warianty (body: `{ paths: [...] }`). |
| GET    | `/api/stats` | Statystyki na pulpit admina. |

### Format wyjściowy `POST /api/uploads/image`

```jsonc
{
  "url":   "https://<proj>.supabase.co/storage/v1/object/public/realizacje/gallery/1731000000-aBcDeFgH-1280.jpg",
  "path":  "gallery/1731000000-aBcDeFgH-1280.jpg",
  "width": 4032, "height": 3024,
  "size": 5120000,
  "mime": "image/jpeg",
  "alt": "BMW 320d na hamowni",
  "lqip": "data:image/jpeg;base64,/9j/4AAQ...",
  "blurhash": "L6Pj0^jE.AyE_3t7t7R**0o#DgR4",
  "variants": [
    { "format": "avif", "width": 480,  "height":  360, "size":  18000, "url": "...", "path": "..." },
    { "format": "webp", "width": 480,  "height":  360, "size":  24000, "url": "...", "path": "..." },
    { "format": "jpeg", "width": 480,  "height":  360, "size":  35000, "url": "...", "path": "..." },
    { "format": "avif", "width": 1280, "height":  960, "size":  72000, "url": "...", "path": "..." },
    { "format": "webp", "width": 1280, "height":  960, "size": 105000, "url": "...", "path": "..." },
    { "format": "jpeg", "width": 1280, "height":  960, "size": 160000, "url": "...", "path": "..." },
    { "format": "avif", "width": 2400, "height": 1800, "size": 195000, "url": "...", "path": "..." },
    { "format": "webp", "width": 2400, "height": 1800, "size": 295000, "url": "...", "path": "..." },
    { "format": "jpeg", "width": 2400, "height": 1800, "size": 460000, "url": "...", "path": "..." }
  ]
}
```

Frontend renderuje to elementem `<picture>`:

```html
<picture>
  <source type="image/avif" srcset="...avif 480w, ...avif 1280w, ...avif 2400w" sizes="(max-width:600px) 100vw, 1200px">
  <source type="image/webp" srcset="...webp 480w, ...webp 1280w, ...webp 2400w" sizes="(max-width:600px) 100vw, 1200px">
  <img src="...jpg" srcset="...jpg 480w, ...jpg 1280w, ...jpg 2400w" sizes="(max-width:600px) 100vw, 1200px"
       width="4032" height="3024" loading="lazy" decoding="async" alt="…"
       style="background:url(LQIP_DATAURL) center/cover">
</picture>
```

---

## 🛡 Bezpieczeństwo

- **JWT** Supabase Auth weryfikowany na każdy request chroniony.
- **RLS** w bazie jako "second line of defense" — patrz `supabase/schema.sql`.
- **CORS allowlist** (origin musi być w `ALLOWED_ORIGINS`).
- **helmet** (m.in. wyłączenie sniffingu, X-Frame-Options).
- **rate-limit** globalny + osobny, ostry dla `/api/leads`.
- **Honeypot** (pole `website`) — jeśli wypełnione, lead od razu trafia do `spam`.
- **file-type** waliduje magic bytes — nie polegamy na `Content-Type`.
- **strip EXIF** (sharp) — usuwa GPS i metadane z wgrywanych zdjęć.
- **multer memoryStorage** + limit `MAX_UPLOAD_BYTES`.
- **trust proxy: 1** — poprawne `req.ip` za reverse-proxy Render.
- **redact** w pino — Authorization, cookies, hasła nie trafiają do logów.

---

## ☁️ Deploy na Render (Blueprint)

1. Wypchnij ten folder do osobnego repo na GitHubie (lub całe repo z `Root Directory: backend`).
2. <https://render.com> → **New** → **Blueprint** → wskaż repo. Render wczyta `render.yaml`.
3. W zakładce **Environment** uzupełnij wartości oznaczone `sync: false`:
   - `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
   - `ALLOWED_ORIGINS` (np. `https://g-lab.pl,https://g-lab-cms.vercel.app`)
   - opcjonalnie SMTP_* i `REVALIDATE_HOOK_URL`
4. Deploy. Render nadpisuje `PORT` automatycznie. Healthcheck = `/health`.

URL serwisu wkleisz potem do strony publicznej (`window.GLAB_API`) i panelu admina (`NEXT_PUBLIC_BACKEND_URL`).

### Alternatywa — Docker

```bash
docker build -t g-lab-backend .
docker run --rm -p 4000:4000 --env-file .env g-lab-backend
```

---

## 🧪 Skrypty

| komenda | działanie |
|---|---|
| `npm run dev` | tsx watch — hot reload |
| `npm run build` | TS → `dist/` |
| `npm start` | uruchamia z `dist/` |
| `npm run typecheck` | tylko sprawdzenie typów |
| `npm run lint` | ESLint |
| `npm test` | vitest (unit testy schemas + utils) |

---

## 🗂 Struktura

```
backend/
├── src/
│   ├── server.ts              # entry point + buildApp()
│   ├── env.ts                 # walidacja ENV (zod)
│   ├── logger.ts              # pino (JSON / pretty)
│   ├── supabase.ts            # admin + as-user clients
│   ├── openapi.ts             # spec OpenAPI 3.0
│   ├── middleware/
│   │   ├── auth.ts            # requireAuth (JWT Supabase)
│   │   ├── cors.ts            # CORS allowlist
│   │   ├── error.ts           # central handler + 404
│   │   ├── rateLimit.ts       # global + leads
│   │   └── requestId.ts       # X-Request-Id
│   ├── routes/
│   │   ├── health.ts          # /health, /health/ready
│   │   ├── auth.ts            # /api/auth/{login,refresh,logout,me}
│   │   ├── realizations.ts    # CRUD
│   │   ├── catalog.ts         # GET + bulk import
│   │   ├── leads.ts           # form inbox + CSV + bulk
│   │   ├── uploads.ts         # image pipeline endpoints
│   │   └── stats.ts           # dashboard
│   ├── services/
│   │   ├── imagePipeline.ts   # sharp → AVIF/WebP/JPEG + LQIP + blurhash
│   │   ├── mailer.ts          # SMTP notifications (opcjonalne)
│   │   └── revalidate.ts      # webhook Netlify/Vercel
│   ├── schemas/index.ts       # zod schemas (single source of truth)
│   └── utils/
│       ├── asyncHandler.ts
│       ├── errors.ts
│       └── slugify.ts
├── tests/                     # vitest
├── supabase/schema.sql        # kopia top-level schema (single source of truth)
├── Dockerfile                 # multi-stage, non-root, healthcheck
├── render.yaml                # Render Blueprint
├── .env.example
├── tsconfig.json
└── package.json
```

---

## ❓ Troubleshooting

**„CORS forbidden"** — uzupełnij `ALLOWED_ORIGINS` o origin (z protokołem, bez slasha na końcu).

**„401 Token jest niepoprawny lub wygasł"** — front nie dołączył nagłówka `Authorization: Bearer <token>`, albo użytkownik się wylogował.

**„413 PAYLOAD_TOO_LARGE"** — obraz większy niż `MAX_UPLOAD_BYTES`. Domyślnie 15 MB.

**„415 UNSUPPORTED_MEDIA_TYPE"** — backend zweryfikował magic bytes pliku i to nie jest obraz w obsługiwanym formacie.

**Render: zimny start** — plan free zasypia po 15 min bezczynności. Endpoint `/health` zwraca szybko (bez DB ping), ale strona publiczna i tak fetchuje runtime — pierwszy request po przebudzeniu wygląda na 1-2 s wolniejszy. Jeśli przeszkadza, przejdź na plan Starter.
