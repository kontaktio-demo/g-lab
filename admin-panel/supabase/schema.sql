-- =====================================================================
-- G-Lab Admin Panel - schemat bazy danych Supabase
-- Wklej całość w: Supabase Dashboard -> SQL Editor -> New query -> Run
-- =====================================================================

-- 1. Rozszerzenia
create extension if not exists "pgcrypto";

-- =====================================================================
-- 2. Tabela: realizations (realizacje warsztatu)
-- =====================================================================
create table if not exists public.realizations (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null unique,
  title        text not null,
  samochod     text not null default '',
  data         date not null default current_date,
  krotki_opis  text not null default '',
  body         text not null default '',
  cover_url    text,
  gallery      jsonb not null default '[]'::jsonb, -- [{ url, alt }]
  published    boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists realizations_data_idx      on public.realizations (data desc);
create index if not exists realizations_published_idx on public.realizations (published);

-- Auto-update updated_at
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end $$;

drop trigger if exists realizations_set_updated_at on public.realizations;
create trigger realizations_set_updated_at
  before update on public.realizations
  for each row execute function public.set_updated_at();

-- =====================================================================
-- 3. Tabela: catalog_cars (auta z CSV)
-- =====================================================================
create table if not exists public.catalog_cars (
  id               bigserial primary key,
  marka            text not null,
  model            text not null default '',
  generacja        text not null default '',
  rok_od           text not null default '',
  rok_do           text not null default '',
  silnik           text not null default '',
  moc_kw_seryjna   integer,
  moc_km_seryjna   integer,
  moc_kw_tuning    integer,
  moc_km_tuning    integer,
  moment_seryjny   integer,
  moment_tuning    integer,
  sterownik        text not null default '',
  slug             text not null unique,
  created_at       timestamptz not null default now()
);

create index if not exists catalog_cars_marka_idx     on public.catalog_cars (marka);
create index if not exists catalog_cars_sterownik_idx on public.catalog_cars (sterownik);

-- =====================================================================
-- 4. Tabela: csv_imports (historia importów katalogu)
-- =====================================================================
create table if not exists public.csv_imports (
  id          uuid primary key default gen_random_uuid(),
  filename    text not null,
  rows_count  integer not null default 0,
  mode        text not null default 'replace' check (mode in ('replace', 'upsert')),
  created_at  timestamptz not null default now(),
  created_by  uuid references auth.users (id) on delete set null
);

-- =====================================================================
-- 5. Storage bucket: realizacje (obrazy)
-- =====================================================================
insert into storage.buckets (id, name, public)
values ('realizacje', 'realizacje', true)
on conflict (id) do nothing;

-- =====================================================================
-- 6. Row Level Security
--    Zapis/edycja/usuwanie - tylko zalogowani użytkownicy.
--    Odczyt opublikowanych realizacji i katalogu - publiczny
--    (żeby strona statyczna mogła pobierać dane bez logowania).
-- =====================================================================
alter table public.realizations enable row level security;
alter table public.catalog_cars enable row level security;
alter table public.csv_imports  enable row level security;

-- realizations
drop policy if exists "Public can read published realizations" on public.realizations;
create policy "Public can read published realizations"
  on public.realizations for select
  using (published = true);

drop policy if exists "Authenticated full access to realizations" on public.realizations;
create policy "Authenticated full access to realizations"
  on public.realizations for all
  to authenticated
  using (true) with check (true);

-- catalog_cars
drop policy if exists "Public can read catalog" on public.catalog_cars;
create policy "Public can read catalog"
  on public.catalog_cars for select
  using (true);

drop policy if exists "Authenticated full access to catalog" on public.catalog_cars;
create policy "Authenticated full access to catalog"
  on public.catalog_cars for all
  to authenticated
  using (true) with check (true);

-- csv_imports - tylko zalogowani
drop policy if exists "Authenticated read csv imports" on public.csv_imports;
create policy "Authenticated read csv imports"
  on public.csv_imports for select to authenticated using (true);

drop policy if exists "Authenticated insert csv imports" on public.csv_imports;
create policy "Authenticated insert csv imports"
  on public.csv_imports for insert to authenticated with check (true);

-- Storage policies (bucket "realizacje")
-- Publiczny odczyt obrazów:
drop policy if exists "Public read realizacje bucket" on storage.objects;
create policy "Public read realizacje bucket"
  on storage.objects for select
  using (bucket_id = 'realizacje');

-- Upload/usuwanie/aktualizacja - tylko zalogowani:
drop policy if exists "Authenticated upload to realizacje bucket" on storage.objects;
create policy "Authenticated upload to realizacje bucket"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'realizacje');

drop policy if exists "Authenticated update realizacje bucket" on storage.objects;
create policy "Authenticated update realizacje bucket"
  on storage.objects for update to authenticated
  using (bucket_id = 'realizacje') with check (bucket_id = 'realizacje');

drop policy if exists "Authenticated delete realizacje bucket" on storage.objects;
create policy "Authenticated delete realizacje bucket"
  on storage.objects for delete to authenticated
  using (bucket_id = 'realizacje');
