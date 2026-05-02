/**
 * SMTP mailer (opcjonalny — aktywny tylko gdy ustawione SMTP_HOST/USER/FROM).
 *
 * Używamy do auto-powiadomień warsztatu o nowych zapytaniach z formularza.
 * Nie blokujemy żądania jeśli mail się nie wyśle — łapiemy błąd i logujemy.
 */
import nodemailer, { type Transporter } from 'nodemailer';
import { env, smtpEnabled } from '../env.js';
import { logger } from '../logger.js';

let transporter: Transporter | null = null;

function getTransporter(): Transporter | null {
  if (!smtpEnabled) return null;
  if (transporter) return transporter;
  transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === 465,
    auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
  });
  return transporter;
}

export async function sendLeadNotification(lead: {
  source: string;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  message?: string | null;
  payload?: Record<string, unknown>;
}): Promise<{ sent: boolean; reason?: string }> {
  const t = getTransporter();
  if (!t) return { sent: false, reason: 'SMTP nie jest skonfigurowany.' };
  if (!env.SMTP_TO) return { sent: false, reason: 'Brak SMTP_TO (adresat).' };

  const html = `
    <h2 style="font-family:system-ui,sans-serif">Nowe zapytanie (${escapeHtml(lead.source)})</h2>
    <table style="font-family:system-ui,sans-serif;border-collapse:collapse">
      <tr><td><b>Imię:</b></td><td>${escapeHtml(lead.name ?? '—')}</td></tr>
      <tr><td><b>E-mail:</b></td><td>${escapeHtml(lead.email ?? '—')}</td></tr>
      <tr><td><b>Telefon:</b></td><td>${escapeHtml(lead.phone ?? '—')}</td></tr>
    </table>
    ${lead.message ? `<p style="font-family:system-ui,sans-serif"><b>Wiadomość:</b><br>${escapeHtml(lead.message).replace(/\n/g, '<br>')}</p>` : ''}
    ${
      lead.payload && Object.keys(lead.payload).length
        ? `<details><summary>Pełne dane</summary><pre style="background:#f5f5f5;padding:8px;border-radius:6px;font-size:12px">${escapeHtml(
            JSON.stringify(lead.payload, null, 2),
          )}</pre></details>`
        : ''
    }
    <hr><p style="font-family:system-ui,sans-serif;font-size:12px;color:#777">G-Lab CMS — automatyczne powiadomienie. Zarządzaj w panelu.</p>
  `;

  try {
    await t.sendMail({
      from: env.SMTP_FROM,
      to: env.SMTP_TO,
      subject: `[G-Lab] Nowe zapytanie (${lead.source})${lead.name ? ` — ${lead.name}` : ''}`,
      html,
      replyTo: lead.email || undefined,
    });
    return { sent: true };
  } catch (err) {
    logger.warn({ err: (err as Error).message }, 'mailer: send failed');
    return { sent: false, reason: (err as Error).message };
  }
}

function escapeHtml(s: string): string {
  return String(s ?? '').replace(/[&<>"']/g, (c) => {
    switch (c) {
      case '&':
        return '&amp;';
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '"':
        return '&quot;';
      case "'":
        return '&#39;';
      default:
        return c;
    }
  });
}
