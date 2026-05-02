import { describe, it, expect } from 'vitest';
import { LeadCreateSchema, RealizationCreateSchema } from '../src/schemas/index.js';

describe('LeadCreateSchema', () => {
  it('przyjmuje minimalne dane (kontakt)', () => {
    const v = LeadCreateSchema.parse({ source: 'kontakt', name: 'Jan', phone: '+48 500 600 700' });
    expect(v.source).toBe('kontakt');
    expect(v.name).toBe('Jan');
  });
  it('odrzuca błędny e-mail', () => {
    expect(() => LeadCreateSchema.parse({ source: 'kontakt', email: 'nope' })).toThrow();
  });
  it('domyślnie source=kontakt', () => {
    const v = LeadCreateSchema.parse({ name: 'A' });
    expect(v.source).toBe('kontakt');
  });
});

describe('RealizationCreateSchema', () => {
  it('wymaga title', () => {
    expect(() => RealizationCreateSchema.parse({})).toThrow();
  });
  it('automatycznie sluguje przekazany slug', () => {
    const v = RealizationCreateSchema.parse({ title: 'BMW 320d', slug: 'BMW Łódź' });
    expect(v.slug).toBe('bmw-lodz');
  });
  it('akceptuje km0/km1 jako string', () => {
    const v = RealizationCreateSchema.parse({ title: 'X', km0: '150', km1: '200' });
    expect(v.km0).toBe(150);
    expect(v.km1).toBe(200);
  });
  it('odrzuca nieznaną usluge', () => {
    expect(() => RealizationCreateSchema.parse({ title: 'X', usluga: 'foo' as unknown as string })).toThrow();
  });
});
