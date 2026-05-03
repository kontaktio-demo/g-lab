# G-Lab — kompletny system: strona + panel + backend

> Statyczna strona warsztatu chiptuningowego G-Lab (Łódź) **plus** zarządzający nią **panel admina** (Next.js, Vercel) i **backend API** (Node + sharp, Render). Wszystko spięte przez **Supabase** (baza + auth + storage). Możesz hostować każdą część osobno, w dowolnej kolejności.

---

## 🏗 Architektura całego systemu

```
                                 ┌─────────────────────────────┐
                                 │        SUPABASE             │
                                 │  PostgreSQL · Auth · Storage│
                                 │  (RLS · bucket "realizacje")│
                                 └──────────────┬──────────────┘
                                                │
            ┌───────────────────────────────────┼───────────────────────────────────┐
            │                                   │                                   │
            ▼                                   ▼                                   ▼
   ┌──────────────────┐              ┌────────────────────┐              ┌──────────────────┐
   │  STRONA          │   fetch JSON │  BACKEND  (Render) │  SDK + RLS  │  ADMIN PANEL     │
   │  PUBLICZNA       │ ────────────>│  Node + Express    │<────────────│  (Vercel)        │
   │  (Netlify/Vercel)│              │  TypeScript + Zod  │             │  Next.js 15      │
   │  HTML+CSS+JS     │              │  sharp + Pino      │             │  React 19        │
   │  static          │   POST /leads│  Helmet + RateLimit│   POST img  │  upload→backend  │
   │                  │ ────────────>│                    │<────────────│  /leads, /CRUD   │
   └──────────────────┘              │  AVIF/WebP/JPG ×3  │             └──────────────────┘
            ▲                        │  LQIP + blurhash   │                       │
            │ revalidate (HMAC)      │  SMTP (nodemailer) │                       │
            └────────────────────────┤  Swagger /api/docs ├───────────────────────┘
                                     └────────────────────┘
```

**Trzy osobne wdrożenia, jedno źródło prawdy (Supabase). Każde może być w osobnym repo.**

| Komponent | Folder w tym repo | Stack | Hosting | Co robi |
|---|---|---|---|---|
| 🌐 **Strona publiczna** | `/` (root) | własny generator Node (`build.js`) → 662 statycznych stron | Netlify · Vercel · GitHub Pages | SEO, katalog, realizacje, formularze |
| 🛠 **Backend API** | `backend/` | Node 20 + Express + TS + Zod + Pino + sharp + Supabase + nodemailer | **Render** | REST API, konwersja obrazów AVIF/WebP, leady, auth, OpenAPI |
| 🧑‍💼 **Panel admina** | `admin-panel/` | Next.js 15 + React 19 + Tailwind + Supabase SSR | **Vercel** | CRUD realizacji, upload, skrzynka zapytań, import CSV katalogu |
| 🗄 **Baza** | `supabase/schema.sql` | PostgreSQL + RLS + Storage | **Supabase** | Realizacje, katalog, leady, pliki |

> 🔁 `supabase/schema.sql` jest **zsynchronizowany** w trzech miejscach (`/`, `admin-panel/supabase/`, `backend/supabase/`) — wystarczy wkleić jeden raz w SQL Editor Supabase.

---

## 🚀 Setup całego systemu — krok po kroku

> Pierwszy raz robisz to ~30 minut. Każdy krok zostawia działający kawałek; możesz przerwać i wrócić.

### 1. Supabase — baza, auth, storage  *(5 min)*

1. Załóż projekt na [supabase.com](https://supabase.com) (free tier wystarczy).
2. Otwórz **SQL Editor** → wklej zawartość `supabase/schema.sql` → **Run**.
3. **Storage** → bucket `realizacje` jest już utworzony przez SQL (publiczny CDN dla obrazów).
4. **Authentication → Users** → **Add user** (e-mail + hasło) — to konto admina do logowania w panelu.
5. Zapisz z **Settings → API**:
   - `Project URL` → `SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_URL`,
   - `anon public key` → `SUPABASE_ANON_KEY` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
   - `service_role key` → `SUPABASE_SERVICE_ROLE_KEY` *(server-only, nigdy nie commituj!)*.

### 2. Backend → Render  *(10 min)*

Folder `backend/` możesz **wyjąć do osobnego repo** i wdrożyć z Blueprintu (`render.yaml`) — albo trzymać tu.

1. Render → **New → Blueprint** → wskaż repo → potwierdź `backend/render.yaml`.
2. Ustaw zmienne (Render dashboard → Environment):
   - `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (z kroku 1)
   - `ALLOWED_ORIGINS=https://twoja-strona.pl,https://twoj-panel.vercel.app`
   - `REVALIDATE_SECRET=…losowy 32-znakowy ciąg…` *(współdzielony z panelem)*
   - **opcjonalnie** SMTP do powiadomień o leadach: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM`, `MAIL_TO`
   - **opcjonalnie** rebuild strony po zmianie: `BUILD_HOOK_URL` (z Netlify/Vercel)
3. Deploy — backend wstaje pod `https://g-lab-backend.onrender.com`. Sprawdź `https://…/health` i `https://…/api/docs` (Swagger UI).
4. Pełna instrukcja, lista endpointów i troubleshooting → **[`backend/README.md`](backend/README.md)**.

### 3. Panel admina → Vercel  *(5 min)*

Folder `admin-panel/` także możesz wyjąć do osobnego repo.

1. Vercel → **Add New → Project** → wskaż repo + root `admin-panel/`.
2. Ustaw zmienne środowiskowe (Project Settings → Environment Variables):
   - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`,
   - `NEXT_PUBLIC_BACKEND_URL=https://g-lab-backend.onrender.com` *(z kroku 2)*,
   - `NEXT_PUBLIC_SITE_URL=https://twoja-strona.pl` *(z kroku 4)*,
   - `REVALIDATE_SECRET=…ten sam co na backendzie…`,
   - `NEXT_PUBLIC_SUPABASE_BUCKET=realizacje`.
3. Deploy. Logowanie kontem z kroku 1.4 — i panel działa.
4. Pełny opis → **[`admin-panel/README.md`](admin-panel/README.md)**.

### 4. Strona publiczna → Netlify (lub Vercel)  *(5 min)*

1. Netlify → **Add new site** → z repo (główne, root).
2. Build command: `npm run build`, publish dir: `public`.
3. Zmienne środowiskowe:
   - `GLAB_API_URL=https://g-lab-backend.onrender.com` *(włącza dynamiczne realizacje + formularze leadów)*,
   - `GLAB_CONTACT_EMAIL=biuro@twojadomena.pl` *(fallback dla `mailto:`)*.
4. **Build hook** (Netlify → Site settings → Build & deploy → Build hooks) → URL skopiuj do `BUILD_HOOK_URL` na backendzie. Po każdym zapisie realizacji w panelu strona przebuduje się automatycznie.

### 5. Test end-to-end  *(2 min)*

- Zaloguj się do panelu → **Realizacje → Nowa** → wgraj zdjęcie → zapisz.  
  ✓ Plik trafił do Supabase Storage z wariantami AVIF/WebP/JPG (sprawdź w Supabase → Storage).  
  ✓ Po ~1 min Netlify zrobił rebuild (jeśli ustawiony `BUILD_HOOK_URL`); na stronie `/realizacje/` widać kartę.  
  ✓ Przed rebuildem karta i tak pojawia się natychmiast (runtime-fetch z backendu).
- Wyślij formularz wyceny na stronie publicznej → w panelu **Skrzynka** zobacz nowy lead, zmień status, zaznacz kilka i wyeksportuj CSV.

---

## 📋 Referencja zmiennych środowiskowych

| Komponent | Zmienna | Wymagana | Opis |
|---|---|---|---|
| **Backend** | `SUPABASE_URL` | ✓ | URL projektu Supabase |
| | `SUPABASE_ANON_KEY` | ✓ | klucz anon (do walidacji JWT od panelu) |
| | `SUPABASE_SERVICE_ROLE_KEY` | ✓ | klucz service-role (omija RLS — TYLKO server) |
| | `SUPABASE_BUCKET` | – | nazwa bucketa, domyślnie `realizacje` |
| | `ALLOWED_ORIGINS` | ✓ | CSV originów dopuszczonych do CORS |
| | `PORT` | – | port HTTP (Render ustawia automatycznie) |
| | `REVALIDATE_SECRET` | – | sekret HMAC do triggerów rebuildu |
| | `BUILD_HOOK_URL` | – | URL build-hooka Netlify/Vercel |
| | `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` | – | powiadomienia e-mail o leadach |
| | `MAIL_FROM` / `MAIL_TO` | – | adres nadawcy / odbiorcy powiadomień |
| | `RATE_LIMIT_*` | – | dostrojenie limitów (mają sensowne defaulty) |
| **Panel admina** | `NEXT_PUBLIC_SUPABASE_URL` | ✓ | URL Supabase |
| | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✓ | klucz anon |
| | `SUPABASE_SERVICE_ROLE_KEY` | ✓ | używany tylko przez Server Actions importu CSV |
| | `NEXT_PUBLIC_SUPABASE_BUCKET` | – | bucket Storage |
| | `NEXT_PUBLIC_BACKEND_URL` | – | bez tego: brak skrzynki zapytań i upload bez konwersji |
| | `NEXT_PUBLIC_SITE_URL` | – | linki „Otwórz na stronie ↗" |
| | `REVALIDATE_SECRET` | – | trigger rebuildu po zapisie |
| **Strona** | `GLAB_API_URL` | – | bez tego: realizacje tylko z markdown, formularz leadów otwiera mailto |
| | `GLAB_CONTACT_EMAIL` | – | fallback `mailto:` |

---

## 📚 Dokumentacja szczegółowa

- 🛠 **Backend (REST API + image pipeline + Render):** [`backend/README.md`](backend/README.md)
- 🧑‍💼 **Panel admina (Next.js + Vercel + skrzynka zapytań):** [`admin-panel/README.md`](admin-panel/README.md)
- 🗄 **Schemat bazy:** [`supabase/schema.sql`](supabase/schema.sql) *(jeden plik do wklejenia w Supabase SQL Editor)*

---

# Strona publiczna — szczegóły

> Statyczna strona warsztatu chiptuningowego G-Lab (Łódź, Rokicińska 266) specjalizującego się w **chiptuningu diesli**, usuwaniu DPF/EGR/AdBlue oraz pomiarach na własnej hamowni podwoziowej.

Strona jest generowana statycznie przez własny generator napisany w czystym Node.js (bez frameworków typu Next/Astro). Wszystkie dane katalogowe pochodzą z jednego pliku `katalog.csv`, treści edytowalne (realizacje, statyczne strony, opinie) - z plików Markdown w `content/`. Edycja przez przeglądarkę odbywa się przez wbudowany Decap CMS w `/admin/` **lub przez nowy panel admina (`admin-panel/`) — patrz wyżej**.

---

## 📦 Spis treści

- [Wymagania](#-wymagania)
- [Szybki start](#-szybki-start-3-minuty)
- [Struktura repozytorium](#-struktura-repozytorium)
- [Funkcje strony](#-funkcje-strony)
- [Dodawanie i edycja treści](#-dodawanie-i-edycja-treści)
  - [Katalog tuningu (katalog.csv)](#1-katalog-tuningu-katalogcsv)
  - [Realizacje](#2-realizacje)
  - [Strony statyczne](#3-strony-statyczne)
  - [Edycja przez przeglądarkę (Decap CMS)](#4-edycja-przez-przeglądarkę-decap-cms)
- [Konfiguracja](#-konfiguracja)
  - [Dane firmy / NAP](#dane-firmy--nap)
  - [Google Analytics 4](#google-analytics-4)
  - [Google Tag Manager](#google-tag-manager)
  - [Microsoft Clarity](#microsoft-clarity)
  - [Adres URL produkcyjny](#adres-url-produkcyjny)
- [Deployment](#-deployment)
  - [Netlify (rekomendowane)](#netlify-rekomendowane)
  - [Vercel](#vercel)
  - [Inne hostingi](#inne-hostingi-statyczne)
- [PWA (Progressive Web App)](#-pwa-progressive-web-app)
- [SEO i schema.org](#-seo-i-schemaorg)
- [Wydajność i Lighthouse](#-wydajność-i-lighthouse)
- [Opcjonalne integracje](#-opcjonalne-integracje)
- [Zgodność prawna i RODO](#-zgodność-prawna-i-rodo)
- [FAQ deweloperskie](#-faq-deweloperskie)

---

## 🛠 Wymagania

- **Node.js ≥ 18** (testowane na 18 LTS i 20 LTS)
- **npm** (wchodzi w skład Node.js)
- System: Linux / macOS / Windows
- Edytor (np. VS Code) i terminal

Brak baz danych, brak runtime serwerowego — wynik buildu to czysty katalog HTML/CSS/JS, który stawiasz na dowolnym hostingu plików statycznych.

---

## 🚀 Szybki start (3 minuty)

```bash
# 1. Sklonuj repo
git clone https://github.com/kontaktio-demo/g-lab.git
cd g-lab

# 2. Zainstaluj zależności
npm install

# 3. Zbuduj stronę do katalogu public/
npm run build

# 4. Wystartuj lokalny serwer (port 8080)
npm run serve
# albo build + serwer w jednej komendzie:
npm run dev
```

Otwórz **http://localhost:8080** w przeglądarce. Po każdej zmianie w `katalog.csv`, `content/`, `templates/`, `src/` lub `build.js` uruchom ponownie `npm run build`.

Wynik buildu: **661 stron** (348 modeli z katalogu × po jednej podstronie + agregaty po marce / silniku / sterowniku + strony narzędziowe + realizacje + sitemap).

---

## 📁 Struktura repozytorium

```
g-lab/
├── build.js                  # Generator statycznej strony (cały silnik)
├── katalog.csv               # Baza danych modeli (źródło prawdy)
├── package.json
├── README.md                 # ten plik
│
├── templates/                # Szablony HTML z placeholderami {{NAZWA}}
│   ├── layout.html           # Główny layout (header, footer, cookie, sticky CTA)
│   ├── home.html             # Strona główna
│   ├── auto.html             # Karta modelu (z dyno + Stage 1/2/3)
│   ├── katalog.html          # Selektor + wyszukiwarka + filtry
│   ├── archiwum.html         # Lista po marce / silniku / sterowniku
│   ├── kalkulatory.html      # 4 kalkulatory (paliwo / stages / ROI / DPF)
│   ├── porownaj.html         # Porównywarka 2-3 modeli
│   ├── wycena.html           # Quiz wyceny w 5 krokach
│   ├── dyno-galeria.html     # Filtrowalna galeria wykresów
│   ├── realizacjeList.html   # Lista realizacji z filtrami
│   ├── realizacja.html       # Pojedyncza realizacja (before/after)
│   └── page.html             # Generyczny szablon strony statycznej
│
├── content/                  # Treści edytowalne (Markdown + frontmatter)
│   ├── pages/                # Strony statyczne: chiptuning, dpf-egr, hamownia, ...
│   └── realizacje/           # Pojedyncze realizacje (data-tytul.md)
│
├── src/                      # Assety źródłowe kopiowane 1:1 do public/
│   ├── css/main.css          # Cały CSS (~1500 linii)
│   ├── img/                  # Logo, favicon, grafiki
│   └── js/                   # Skrypty front-endowe
│       ├── main.js           # Menu, cookie consent
│       ├── catalog.js        # Selektor + wyszukiwarka katalogu
│       ├── kalkulatory.js    # Logika 4 kalkulatorów
│       ├── porownaj.js       # Porównywarka modeli
│       ├── wycena.js         # Quiz wyceny (mailto submit)
│       ├── dyno-galeria.js   # Filtry + lightbox galerii
│       ├── realizacje-filter.js # Filtry realizacji + before/after
│       ├── counters.js       # Animowane liczniki
│       └── sw-register.js    # Rejestracja PWA service workera
│
└── public/                   # Wynik buildu (gitignored, generowane)
```

---

## ✨ Funkcje strony

### Katalog
- **348 modeli diesli** generowanych z `katalog.csv` (każdy = osobna podstrona z meta + schema)
- **Animowany wykres dyno SVG** (moc + moment, przed/po) generowany z peak power/torque
- **Pełna karta specyfikacji** (KM/kW seryjny i po tuningu, moment, sterownik, generacja, pojemność, lata)
- **Stage 1 / 2 / 3** w karcie modelu — szacunkowe wartości, koszty, ryzyka
- **„Inni wybierali także"** — 3 modele tej samej marki w podobnym zakresie mocy
- **Wyszukiwarka full-text** (po marce, modelu, silniku, ECU, slugu) — w pełni client-side
- **Filtry zaawansowane** — pojemność, sterownik (ECU), sortowanie po przyroście
- **Schema.org Product + Offer + AggregateRating** dla rich snippets w Google

### Kalkulatory (`/kalkulatory/`)
1. **Oszczędność paliwa** — roczna i 5-letnia w zł
2. **Stage 1 / 2 / 3** dla wybranego auta z bazy
3. **ROI tuningu** — po ilu km i miesiącach się zwraca
4. **DPF / AdBlue** — oszczędności roczne i 5-letnie

Wszystko liczone lokalnie w przeglądarce — dane nie opuszczają komputera klienta.

### Porównywarka (`/porownaj/`)
- **2 lub 3 modele obok siebie** z paskami wizualnymi (KM, Nm, przyrost)
- **URL do dzielenia** (`?cars=slug1,slug2,slug3`)
- Auto-uzupełnianie z bazy katalogowej

### Quiz „Wyceń tuning" (`/wycena/`)
- **5 kroków** z paskiem postępu i gamifikacją (karty z radio)
- **Pre-fill** z parametru `?slug=...` (z karty modelu)
- **Mailto submission** — generuje gotowy e-mail do wysłania
- **Event GA4 / GTM** `generate_lead` przy submit

### Galeria hamowni (`/galeria-hamowni/`)
- **Filtrowalna baza wykresów dyno** (marka, stage, min KM, sortowanie)
- **Brandowane SVG** — kolory G-Lab (pomarańcz/żółty)
- **Liczniki agregaty** — łącznie X wykresów, średni przyrost Y KM
- **Lightbox / fullscreen** (Esc, klik w tło)

### Realizacje (`/realizacje/`)
- **Filtry klient-side** — marka / typ usługi / rok
- **Before/after slider** (gdy zdjęcie ma alt z `before`/`after`)
- **Mini-wykres dyno** z `km0/km1/nm0/nm1` w frontmatterze
- **Sekcja „Użyte narzędzia"**
- **Edytowalne przez Decap CMS** (`/admin/`)

### Lead generation
- **Sticky pasek CTA** na mobile (Zadzwoń + Wyceń tuning)
- **Click-to-call** w nagłówku (zawsze widoczny telefon)
- **CTA box** w karcie modelu (Wyceń tuning + Umów wizytę)

### Zaufanie / Social proof
- **Animowane liczniki** przy scrollu (lat doświadczenia, modeli, pomiarów, średni przyrost)
- **Sekcja opinii** z gwiazdkami i agregowaną oceną
- **AggregateRating** w schema (Google pokazuje gwiazdki w wynikach)

---

## ✏️ Dodawanie i edycja treści

### 1. Katalog tuningu (`katalog.csv`)

Każdy wiersz = jeden model, który dostanie własną podstronę pod `/tuning/<slug>`.

**Wymagane kolumny:**

| kolumna | przykład | opis |
|---|---|---|
| `marka` | `BMW` | nazwa producenta |
| `model` | `Seria 3` | model |
| `generacja` | `F30` | generacja / kod nadwozia |
| `rok_od` | `2012` | rok rozpoczęcia produkcji |
| `rok_do` | `2019` | rok zakończenia |
| `silnik` | `320d 2.0` | nazwa silnika z pojemnością |
| `moc_kw_seryjna` | `135` | moc seryjna w kW |
| `moc_km_seryjna` | `184` | moc seryjna w KM |
| `moc_kw_tuning` | `170` | moc po tuningu w kW |
| `moc_km_tuning` | `231` | moc po tuningu w KM |
| `moment_seryjny` | `380` | moment seryjny w Nm |
| `moment_tuning` | `460` | moment po tuningu w Nm |
| `sterownik` | `EDC17C50` | kod ECU |
| `slug` | (opcjonalne) | jeśli puste, generujemy automatycznie |

**Po edycji** uruchom `npm run build`. Pojemność wykrywamy automatycznie z nazwy silnika (np. `2.0`).

### 2. Realizacje

Dodaj plik Markdown do `content/realizacje/`. Nazwa pliku: `YYYY-MM-DD-slug.md`.

```yaml
---
title: BMW 320d F30 Stage 1 + DPF off
slug: bmw-320d-f30-stage-1
samochod: BMW 320d F30 (2014)
marka: BMW
usluga: chiptuning           # chiptuning | dpf-egr | hamownia | inne
stage: Stage 1
silnik: 2.0d
sterownik: EDC17C50
data: 2024-09-15
krotki_opis: 184 -> 231 KM, 380 -> 460 Nm. DPF mechanicznie wyjęty.
cover: /img/realizacje/bmw-320d.webp
km0: 184
km1: 231
nm0: 380
nm1: 460
gallery:
  - { image: /img/realizacje/bmw-320d-przed.webp, alt: "before - przed pomiarem" }
  - { image: /img/realizacje/bmw-320d-po.webp, alt: "after - po tuningu" }
narzedzia:
  - KESS V3
  - Hamownia MAHA LPS3000
  - Endoskop diagnostyczny
---

Pełny opis realizacji w **Markdownie**...
```

**Wskazówki:**
- Gdy w galerii są zdjęcia z altem zawierającym `before`/`przed` i `after`/`po`, automatycznie pojawia się **interaktywny suwak** porównujący przed/po.
- Pola `km0/km1/nm0/nm1` aktywują **mini-wykres dyno** w realizacji oraz dodają wpis do galerii hamowni.
- Pola `marka` / `usluga` / `data` (rok) napędzają filtry na liście realizacji.

### 3. Strony statyczne

Pliki `content/pages/*.md` z frontmatterem `title`, `subtitle`, `slug`. Treść w Markdownie. Dla wybranych slugów (`chiptuning`, `dpf-egr`, `hamownia`) automatycznie dodajemy sekcję FAQ + schema FAQPage zdefiniowane w `build.js` (`FAQ_BY_SLUG`).

### 4. Edycja przez przeglądarkę (Decap CMS)

Strona ma wbudowany **Decap CMS** (otwarte oprogramowanie, fork Netlify CMS) dostępny pod `/admin/`. Pozwala dodawać realizacje i edytować strony bez znajomości git/markdown.

**Konfiguracja jednorazowa (po pierwszym deployu na Netlify):**

1. W panelu Netlify wejdź w **Site settings → Identity** → kliknij **Enable Identity**.
2. **Identity → Registration preferences** → ustaw na **Invite only** (żeby nikt z zewnątrz się nie zarejestrował).
3. **Identity → Services → Git Gateway** → kliknij **Enable Git Gateway**.
4. **Identity → Invite users** → wpisz e-mail klienta (zaproszenie + ustawienie hasła).
5. Klient loguje się na `https://twoja-domena.pl/admin/` swoim e-mailem.

Inne hostingi (Vercel, Cloudflare Pages, GitHub Pages): zmień backend w `build.js` w sekcji `buildAdmin()` na `github` (https://decapcms.org/docs/github-backend/) lub `gitlab`.

---

## ⚙️ Konfiguracja

### Dane firmy / NAP

W `build.js` na początku znajduje się obiekt `BUSINESS`:

```js
const BUSINESS = {
  name: 'G-Lab Chip Tuning',
  legalName: 'G-Lab Diesel Tuning',
  street: 'Rokicińska 266',
  postal: '92-620',
  city: 'Łódź',
  ...
  phone: '+48 508 146 945',
  email: 'kontakt@g-lab.pl',
  founded: 2006,
};
```

Zmień te wartości jeśli zmieniają się dane kontaktowe firmy. Po zmianie odbuduj stronę: `npm run build`. NAP jest używany w:
- nagłówku (telefon + click-to-call)
- stopce
- structured data `LocalBusiness` (Google Business Profile)
- mailto z formularza wyceny

### Google Analytics 4

Ustaw zmienną środowiskową przed buildem:

```bash
GA4_ID=G-XXXXXXXXXX npm run build
```

Skrypt GA4 zostanie automatycznie wstrzyknięty do `<head>` każdej strony. Eventy custom: `generate_lead` (po quizie wyceny).

### Google Tag Manager

```bash
GTM_ID=GTM-XXXXXX npm run build
```

Zarówno `<head>` snippet jak i `<noscript>` w `<body>` są wstrzykiwane automatycznie.

### Microsoft Clarity

Heatmapy, nagrania sesji, analiza skrolla:

```bash
CLARITY_ID=xxxxxxxxxx npm run build
```

Możesz łączyć kilka:
```bash
GA4_ID=G-XXX GTM_ID=GTM-YYY CLARITY_ID=zzz npm run build
```

### Adres URL produkcyjny

```bash
SITE_URL=https://g-lab.pl npm run build
```

Domyślnie `https://g-lab.pl`. Wpływa na canonical, og:url, sitemap, schema.org.

### Wszystko razem (przykład produkcyjnego buildu)

```bash
SITE_URL=https://g-lab.pl \
GA4_ID=G-XXXXXXXXXX \
GTM_ID=GTM-XXXXXX \
CLARITY_ID=xxxxxxxxxx \
npm run build
```

W Netlify ustaw te zmienne w **Site settings → Build & deploy → Environment**.

---

## 🚢 Deployment

### Netlify (rekomendowane)

Najszybszy wariant — kilka kliknięć i działa.

1. Zaloguj się w **app.netlify.com** → **Add new site → Import from Git**.
2. Wybierz repozytorium GitHub.
3. **Build command:** `npm run build`
4. **Publish directory:** `public`
5. **Environment variables:** `SITE_URL`, `GA4_ID`, `GTM_ID`, `CLARITY_ID` (jeśli używasz).
6. **Domain settings → Add custom domain** → wpisz `g-lab.pl`. Netlify automatycznie wystawi certyfikat Let's Encrypt.
7. Włącz Identity + Git Gateway dla CMS (patrz wyżej).

Plik `_redirects` jest generowany automatycznie podczas buildu (m.in. 301 z `/katalog` na `/katalog/`).

### Vercel

```bash
npm install -g vercel
vercel --prod
```

W ustawieniach projektu Vercel: **Build command:** `npm run build`, **Output directory:** `public`.

### Inne hostingi statyczne

Cały katalog `public/` to zwykłe pliki HTML — działa wszędzie:
- **GitHub Pages** (`gh-pages` branch)
- **Cloudflare Pages**
- **AWS S3 + CloudFront**
- **nginx / Apache** na własnym VPS — wystarczy:

```nginx
server {
  listen 80;
  server_name g-lab.pl www.g-lab.pl;
  root /var/www/g-lab/public;
  index index.html;
  location / { try_files $uri $uri/ $uri.html =404; }
  location /admin/ { try_files $uri $uri/ /admin/index.html; }
  gzip on;
  gzip_types text/css application/javascript application/json image/svg+xml;
}
```

---

## 📱 PWA (Progressive Web App)

Strona jest instalowalna jako aplikacja na telefonie / desktopie. Generujemy:
- `manifest.webmanifest` — metadane aplikacji
- `sw.js` — service worker (network-first dla HTML, cache-first dla CSS/JS/img)

**Co to daje:**
- ikona aplikacji na ekranie głównym telefonu
- działanie offline (cached shell + ostatnio odwiedzone strony)
- szybsze ładowanie powracających odwiedzin
- wyższy wynik Lighthouse PWA

**Update'y:** SW ma wersjonowanie `g-lab-<timestamp>` — przy każdym buildzie cache się unieważnia automatycznie.

---

## 🔍 SEO i schema.org

Wszystko gotowe out-of-the-box:

| Typ schematu | Gdzie |
|---|---|
| `LocalBusiness` (`AutoRepair`) | strona główna + kontakt |
| `Product` + `Offer` + `AggregateRating` | każda karta modelu |
| `Service` | `/chiptuning`, `/dpf-egr`, `/hamownia` |
| `FAQPage` | strona główna + strony usług |
| `BreadcrumbList` | każda podstrona |
| `WebSite` + `SearchAction` | strona główna (search box w Google) |

Plus:
- **Sitemap.xml** z `priority` + `changefreq` per typ strony
- **robots.txt** z `Disallow: /admin/`
- **Canonical URL** na każdej stronie
- **Open Graph + Twitter Cards** + dynamicznie generowany OG image SVG (1200×630)
- **Breadcrumbs** (zarówno HTML jak i JSON-LD)
- **`hreflang`** — pominięte (strona tylko PL)

**Walidacja po deployu:**
- https://search.google.com/test/rich-results — testuj kartę modelu
- https://validator.schema.org/ — weryfikacja structured data
- https://www.google.com/webmasters — submit `sitemap.xml`

---

## ⚡ Wydajność i Lighthouse

Strona jest projektowana pod **Lighthouse 95+** na każdej podstronie:

- **Statyczny HTML** = brak runtime JS na większości stron
- **CSS bez frameworka** (~50 kB skompresowane)
- **Brak fontów zewnętrznych** — używamy systemowych (`Inter, system-ui, sans-serif`)
- **Wszystkie obrazy** mają `loading="lazy"` i `decoding="async"`
- **SVG-first** dla logo, favicon, OG image, wykresów dyno (skalują się idealnie, są lekkie)
- **Service Worker** dla powracających użytkowników
- **Defer** na wszystkich `<script>`

**Lokalna walidacja:**
```bash
npm run dev
# w innym oknie:
npx lighthouse http://localhost:8080/tuning/bmw-seria-3-f30-320d-2-0.html --view
```

**Optymalizacja obrazów realizacji:** zalecamy konwersję do **WebP** lub **AVIF** przed wgraniem (np. squoosh.app). Generator nie konwertuje automatycznie, żeby nie wymagać `sharp` jako zależności (50+ MB binarki).

---

## 🔌 Opcjonalne integracje

### Google Places API (opinie z Google)

W obecnej wersji opinie są statyczne (zaszyte w `buildHome()`). Aby dynamicznie pobierać z Google:

1. Włącz **Places API** w Google Cloud Console.
2. Wygeneruj klucz API z restrykcjami HTTP referer (`g-lab.pl/*`).
3. Pobierz opinie skryptem (np. cron na serwerze) zapisujący JSON do `content/google-reviews.json`.
4. W `build.js` rozszerz sekcję `reviewsHtml` o renderowanie z pliku.

Klucz API **nigdy** nie powinien być wstawiony bezpośrednio do kodu front-end — pobierając opinie po stronie serwera (build-time) unikamy wycieku klucza.

### WhatsApp / Messenger sticky button

W `templates/layout.html` w sekcji `.sticky-cta` możesz dodać kolejny button:

```html
<a href="https://wa.me/48508146945" class="sticky-cta-btn">WhatsApp</a>
```

### Reklamy Google Ads / Facebook Pixel

Dodaj do `analyticsHead()` w `build.js` — działa identycznie jak GA4/GTM (zmienna środowiskowa + wstrzyknięcie do `<head>`).

---

## ⚖️ Zgodność prawna i RODO

- **Cookie consent banner** (Niezbędne / Analityczne / Marketingowe) — gotowy w `layout.html`, zarządzany przez `src/js/main.js`. Skrypty GA4/GTM/Clarity NIE są ładowane przed akceptacją kategorii „Analityczne".
- **Polityka prywatności** + **Regulamin** — `content/pages/polityka-prywatnosci.md` i `regulamin.md`. **Należy** je zaktualizować pod realne dane firmy i obowiązujące przepisy (zalecamy konsultację z prawnikiem).
- **Disclaimer DPF/AdBlue** — kalkulator zawiera widoczną informację, że modyfikacje układu wydechowego są dopuszczone tylko poza ruchem publicznym.
- **Dane z formularza** quizu wyceny **nie są wysyłane na żaden serwer** — generujemy mailto z gotową treścią dla domyślnego klienta pocztowego użytkownika.

---

## 🧰 FAQ deweloperskie

**Pytanie:** Jak dodać nową stronę statyczną (np. `/cennik`)?
**Odpowiedź:** Stwórz `content/pages/cennik.md` z frontmatterem `title`, `slug: cennik`, ewentualnie `subtitle` i treścią. Odbuduj stronę.

**P:** Jak zmienić kolory marki (pomarańczowy / żółty)?
**O:** W `src/css/main.css` użyj search&replace na `#ff001e` (primary) i `#ff5566` (accent). Wkrótce planujemy wynieść je do CSS custom properties.

**P:** Jak zmienić zdjęcia opinii / dodać prawdziwych klientów?
**O:** Edytuj `reviewsHtml` w funkcji `buildHome()` w `build.js`, lub przenieś listę do `content/opinie.json` i wczytaj w `loadOpinions()`.

**P:** Jak dodać kolejny kalkulator?
**O:** 1) dopisz tab + panel w `templates/kalkulatory.html`, 2) dopisz logikę w `src/js/kalkulatory.js`, 3) ewentualnie dodaj CSS w `main.css`. Build, gotowe.

**P:** Czy katalog można zaimportować z innego źródła (np. Tuningfiles, BHP-Tuning)?
**O:** Tak — wystarczy skonwertować dane do `katalog.csv` (format opisany wyżej). Generator obsłuży dowolną liczbę modeli, sprawdziliśmy do ~5000 wpisów.

**P:** Co z benzynowcami?
**O:** G-Lab specjalizuje się **wyłącznie w dieslach** — komunikacja, FAQ, kalkulatory są pisane pod tym kątem. Jeśli kiedykolwiek dojdą benzynowce, należy dodać kolumnę `paliwo` do CSV i rozszerzyć detekcję w `detectFuel()` w `build.js`.

**P:** Build wywala się, co robić?
**O:** 1) sprawdź `node --version` (≥ 18), 2) `rm -rf node_modules && npm install`, 3) sprawdź czy nie ma literówek w nowych wpisach `katalog.csv` (np. brak kolumny, zła liczba przecinków).

---

## 📝 Licencja

Cały kod w tym repozytorium jest własnością G-Lab Chip Tuning Łódź. Wszelkie prawa zastrzeżone.

## 🙋 Kontakt techniczny

Pytania dot. strony — przez issue w GitHub Issues tego repozytorium.

Pytania biznesowe / dot. tuningu — **G-Lab Chip Tuning**, Rokicińska 266, 92-620 Łódź, **+48 508 146 945**, **kontakt@g-lab.pl**.
