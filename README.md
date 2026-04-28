# G-Lab Chip Tuning – strona

Statyczna strona firmy chiptuningowej **g-lab.pl**, generowana z plików w repo:

- **Katalog tuningu** – baza modeli aut z `katalog.csv` → osobna podstrona dla każdego auta (kluczowe dla SEO).
- **Realizacje** – pliki markdown w `content/realizacje/`, edytowalne przez **Decap CMS** pod adresem `/admin/`.
- **Statyczne podstrony** (chiptuning, DPF/EGR, hamownia, kontakt) – markdown w `content/pages/`.

Stack: **vanilla HTML/CSS/JS** + **Node.js** (skrypt buildujący) + **Decap CMS** + **Netlify Identity** + **Netlify / Cloudflare Pages** jako hosting.

---

## Struktura repo

```
├── katalog.csv               # źródło danych katalogu (edytuje właściciel)
├── content/
│   ├── realizacje/           # pliki .md realizacji (edytuje pracownica przez CMS)
│   └── pages/                # markdown statycznych podstron
├── templates/                # szablony HTML
├── src/                      # CSS, JS, obrazki
│   ├── css/main.css
│   ├── js/main.js, catalog.js
│   └── img/
├── build.js                  # skrypt Node.js generujący stronę
├── package.json
├── netlify.toml              # konfiguracja Netlify
└── public/                   # output (to co idzie na hosting; w .gitignore)
    ├── index.html
    ├── katalog/index.html
    ├── tuning/[slug].html
    ├── marka/[marka].html
    ├── sterownik/[sterownik].html
    ├── silnik/[silnik].html
    ├── realizacje/index.html
    ├── realizacje/[slug].html
    ├── chiptuning.html, dpf-egr.html, hamownia.html, kontakt.html
    ├── sitemap.xml, robots.txt
    └── admin/                # Decap CMS
```

---

## Lokalne uruchomienie

Wymaga Node.js 20+.

```bash
npm install        # tylko raz
npm run build      # generuje public/
npm run serve      # lokalny serwer http://localhost:8080
# albo razem:
npm run dev
```

---

## Format katalogu (`katalog.csv`)

Kolumny:

| kolumna | opis | przykład |
|---|---|---|
| `marka` | producent | `BMW` |
| `model` | model | `Seria 3` |
| `generacja` | kod generacji | `F30` |
| `rok_od` | początek produkcji | `2012` |
| `rok_do` | koniec produkcji | `2019` |
| `silnik` | nazwa jednostki | `320d 2.0` |
| `moc_kw_seryjna` | moc fabryczna [kW] | `135` |
| `moc_km_seryjna` | moc fabryczna [KM] | `184` |
| `moc_kw_tuning` | moc po tuningu [kW] | `170` |
| `moc_km_tuning` | moc po tuningu [KM] | `231` |
| `moment_seryjny` | moment fabryczny [Nm] | `380` |
| `moment_tuning` | moment po tuningu [Nm] | `460` |
| `sterownik` | sterownik silnika | `Bosch EDC17C50` |
| `slug` | część adresu URL | `bmw-seria-3-f30-320d-2-0` |

> **Tip dla właściciela:** plik można edytować w Excelu / Google Sheets, eksportować jako CSV (UTF-8, separator przecinek) i wrzucać do GitHuba przez interfejs WWW — push automatycznie odpala build.

---

## Workflow aktualizacji

### Aktualizacja katalogu (właściciel)

1. Edytujesz `katalog.csv` w Excelu / Google Sheets.
2. Eksportujesz jako **CSV (UTF-8, przecinek)**.
3. Wgrywasz na GitHubie: repozytorium → plik `katalog.csv` → ołówek → Wklej zawartość → **Commit changes**.
4. Hosting wykrywa push i sam przebudowuje stronę (~1 min).

### Aktualizacja realizacji (pracownica)

1. Wchodzi na `https://g-lab.pl/admin/`.
2. Loguje się (mailem przez Netlify Identity).
3. Klika **„+ Realizacje"**, wypełnia formularz, dodaje zdjęcia.
4. **Publish** → Decap commituje plik `.md` do GitHuba → automatyczny rebuild.

---

## Deploy

### Wariant A — Netlify (rekomendowany ze względu na Identity / Decap CMS)

1. **Wypchnij repo na GitHuba** (jeśli jeszcze go tam nie ma).
2. Wejdź na [app.netlify.com](https://app.netlify.com) i zaloguj się GitHubem.
3. **Add new site → Import an existing project → GitHub**, wskaż repo.
4. Build settings (Netlify wczyta z `netlify.toml`):
   - Build command: `npm run build`
   - Publish directory: `public`
5. **Deploy site** — po chwili dostaniesz adres `nazwa.netlify.app`.
6. **Domena:** Site settings → Domain management → Add custom domain → `g-lab.pl`. Wpisy DNS:
   - `A` → `75.2.60.5` (Netlify load balancer)
   - `CNAME www` → `nazwa.netlify.app`
   - Netlify sam wystawi HTTPS (Let's Encrypt).
7. **Włącz Identity** (logowanie pracownicy):
   - Site → **Identity** → **Enable Identity**.
   - **Settings → Registration**: ustaw **Invite only** (zapraszasz ręcznie, nie ma publicznej rejestracji).
   - **Settings → Services → Git Gateway** → **Enable Git Gateway**.
   - **Identity → Invite users** → wpisujesz e-mail pracownicy.
   - Pracownica dostaje maila, ustawia hasło i loguje się na `/admin/`.
8. **Automatyczny rebuild** działa od razu — każdy push do `main` (zarówno ręczny, jak i ten z Decap CMS) odpala build.

### Wariant B — Cloudflare Pages (szybszy CDN, ale wymaga zewnętrznego auth dla CMS)

1. [dash.cloudflare.com](https://dash.cloudflare.com) → **Workers & Pages → Create → Pages → Connect to Git**.
2. Wybierz repo. Build:
   - Framework preset: **None**
   - Build command: `npm run build`
   - Build output directory: `public`
   - Node version (zmienna środowiskowa): `NODE_VERSION = 20`
3. **Save and Deploy** — adres `nazwa.pages.dev`.
4. **Custom domain:** Pages → projekt → **Custom domains → Set up a custom domain → g-lab.pl** (Cloudflare jako DNS skonfiguruje samo).
5. **CMS na Cloudflare:** Cloudflare nie ma własnej usługi typu Identity. Najprostsze opcje:
   - Trzymać CMS na Netlify Identity, a tylko hostować na Cloudflare (działa).
   - Albo użyć **GitHub OAuth** z [Decap OAuth providerem](https://decapcms.org/docs/external-oauth-clients/) (np. własny Worker).

> Dla osoby nietechnicznej **rekomendujemy Netlify** — Identity + Git Gateway działają „z pudełka".

### Po pierwszym deployu

- Odwiedź `https://g-lab.pl/sitemap.xml` i zgłoś sitemap w **Google Search Console**.
- Sprawdź `https://g-lab.pl/robots.txt`.
- Zaloguj się na `/admin/` i dodaj pierwszą realizację jako test.

---

## Co jest zrobione

- [x] **Etap 1 – prototyp katalogu** (15 przykładowych aut, kaskadowe selekty, podstrony, archiwa, sitemap)
- [x] **Etap 2 – CMS** (Decap CMS w `/admin/`, schemat „Realizacja", git-gateway / Netlify Identity)
- [x] **Etap 3 – pozostałe podstrony** (chiptuning, DPF/EGR, hamownia, kontakt — wszystko w markdown)
- [x] **Etap 4 – instrukcja deploya** (powyżej, plus `netlify.toml`)

## Co dalej

- Wymienić `katalog.csv` na finalny plik od klienta (kilka tysięcy wierszy — build skaluje się liniowo).
- Podmienić dane kontaktowe w `content/pages/kontakt.md`, footerze (`templates/layout.html`) i ewentualnie dodać embed mapy Google.
- Zoptymalizować obrazki realizacji (Decap pozwala wgrywać oryginały — można dodać `imagemin` w build, jeśli waga będzie problemem).
