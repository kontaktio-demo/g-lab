import { describe, it, expect } from 'vitest';
import { slugify } from '../src/utils/slugify.js';

describe('slugify', () => {
  it('przerabia polskie znaki', () => {
    expect(slugify('Łódź — BMW 320d')).toBe('lodz-bmw-320d');
  });
  it('zamienia spacje na myślniki', () => {
    expect(slugify('  Audi  A4  B8  ')).toBe('audi-a4-b8');
  });
  it('usuwa znaki specjalne', () => {
    expect(slugify('VW!@#Passat$$%B7')).toBe('vw-passat-b7');
  });
  it('akceptuje pusty string', () => {
    expect(slugify('')).toBe('');
    expect(slugify(undefined as unknown as string)).toBe('');
  });
});
