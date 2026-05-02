'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const items = [
  { href: '/',           label: 'Pulpit',        icon: '◧' },
  { href: '/realizacje', label: 'Realizacje',    icon: '★' },
  { href: '/leads',      label: 'Skrzynka',      icon: '✉' },
  { href: '/katalog',    label: 'Katalog (CSV)', icon: '⊞' },
];

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || '').replace(/\/$/, '');

export default function Sidebar() {
  const path = usePathname();
  return (
    <aside className="hidden md:flex md:w-64 shrink-0 flex-col border-r border-border bg-bg-elev/60 backdrop-blur-sm">
      <div className="px-6 py-6 border-b border-border">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-[10px] bg-grad-accent flex items-center justify-center font-bold text-white shadow-soft">
            G
          </div>
          <div>
            <div className="font-bold tracking-tight leading-none">G-Lab</div>
            <div className="text-[11px] uppercase tracking-widest text-text-muted mt-0.5">CMS</div>
          </div>
        </Link>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {items.map((it) => {
          const active = it.href === '/'
            ? path === '/'
            : path.startsWith(it.href);
          return (
            <Link
              key={it.href}
              href={it.href}
              className={[
                'flex items-center gap-3 px-3 py-2.5 rounded-[10px] text-sm font-medium transition-colors',
                active
                  ? 'bg-accent/10 text-accent border border-accent/30'
                  : 'text-text-muted hover:text-text hover:bg-bg-elev-2 border border-transparent',
              ].join(' ')}
            >
              <span className="w-5 text-center text-base">{it.icon}</span>
              {it.label}
            </Link>
          );
        })}
        {SITE_URL && (
          <a
            href={SITE_URL}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-3 px-3 py-2.5 rounded-[10px] text-sm font-medium transition-colors
                       text-text-muted hover:text-text hover:bg-bg-elev-2 border border-transparent"
          >
            <span className="w-5 text-center text-base">↗</span>
            Strona publiczna
          </a>
        )}
      </nav>

      <div className="p-3 border-t border-border text-[11px] text-text-muted">
        <div className="px-3 py-2">
          v1.1 · <a className="hover:text-accent" href="https://supabase.com" target="_blank" rel="noreferrer">Supabase</a> · <a className="hover:text-accent" href="https://render.com" target="_blank" rel="noreferrer">Render</a>
        </div>
      </div>
    </aside>
  );
}
