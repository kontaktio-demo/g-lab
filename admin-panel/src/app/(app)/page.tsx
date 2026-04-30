import Link from 'next/link';
import Topbar from '@/components/Topbar';
import { createClient } from '@/lib/supabase/server';
import RealizationCard from '@/components/RealizationCard';
import type { Realization } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const supabase = await createClient();

  const [{ count: realizationsCount }, { count: catalogCount }, { data: latest }] = await Promise.all([
    supabase.from('realizations').select('*', { count: 'exact', head: true }),
    supabase.from('catalog_cars').select('*', { count: 'exact', head: true }),
    supabase.from('realizations').select('*').order('updated_at', { ascending: false }).limit(3),
  ]);

  const stats = [
    { label: 'Realizacje',    value: realizationsCount ?? 0, href: '/realizacje', accent: true },
    { label: 'Auta w katalogu', value: catalogCount ?? 0,    href: '/katalog' },
    { label: 'Ostatnia zmiana', value: latest?.[0]?.updated_at
        ? new Date(latest[0].updated_at).toLocaleDateString('pl-PL')
        : '—' },
  ];

  return (
    <>
      <Topbar
        title="Pulpit"
        subtitle="Witaj w panelu G-Lab CMS"
        actions={
          <Link href="/realizacje/new" className="btn-primary">
            <span aria-hidden>＋</span> Nowa realizacja
          </Link>
        }
      />

      <main className="p-5 md:p-8 space-y-8">
        {/* Statystyki */}
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {stats.map((s) => (
            <Link
              key={s.label}
              href={s.href ?? '#'}
              className={[
                'card p-6 card-hover',
                s.accent ? 'border-accent/30' : '',
              ].join(' ')}
            >
              <div className="text-xs uppercase tracking-widest text-text-muted">{s.label}</div>
              <div className="mt-2 text-3xl font-bold tracking-tight">{s.value as React.ReactNode}</div>
            </Link>
          ))}
        </section>

        {/* Najnowsze realizacje */}
        <section>
          <div className="flex items-end justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold">Najnowsze realizacje</h2>
              <p className="section-subtitle">Tak wyglądają kafelki na stronie publicznej.</p>
            </div>
            <Link href="/realizacje" className="btn-secondary text-xs">Zobacz wszystkie</Link>
          </div>

          {latest && latest.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {(latest as Realization[]).map((r) => <RealizationCard key={r.id} r={r} />)}
            </div>
          ) : (
            <div className="card p-10 text-center text-text-muted">
              Brak realizacji. <Link href="/realizacje/new" className="text-accent hover:underline">Dodaj pierwszą</Link>.
            </div>
          )}
        </section>
      </main>
    </>
  );
}
