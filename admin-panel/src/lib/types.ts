export type GalleryItem = { url: string; alt?: string };

export type Realization = {
  id: string;
  slug: string;
  title: string;
  samochod: string;
  data: string; // YYYY-MM-DD
  krotki_opis: string;
  body: string;
  cover_url: string | null;
  gallery: GalleryItem[];
  published: boolean;
  created_at: string;
  updated_at: string;
};

export type CatalogCar = {
  id: number;
  marka: string;
  model: string;
  generacja: string;
  rok_od: string;
  rok_do: string;
  silnik: string;
  moc_kw_seryjna: number | null;
  moc_km_seryjna: number | null;
  moc_kw_tuning: number | null;
  moc_km_tuning: number | null;
  moment_seryjny: number | null;
  moment_tuning: number | null;
  sterownik: string;
  slug: string;
  created_at: string;
};

export const CATALOG_CSV_HEADERS = [
  'marka','model','generacja','rok_od','rok_do','silnik',
  'moc_kw_seryjna','moc_km_seryjna','moc_kw_tuning','moc_km_tuning',
  'moment_seryjny','moment_tuning','sterownik','slug',
] as const;

export type CsvImportRow = {
  marka: string; model: string; generacja: string;
  rok_od: string; rok_do: string; silnik: string;
  moc_kw_seryjna: number | null; moc_km_seryjna: number | null;
  moc_kw_tuning: number | null;  moc_km_tuning: number | null;
  moment_seryjny: number | null; moment_tuning: number | null;
  sterownik: string; slug: string;
};
