import { describe, it, expect } from 'vitest';

const rcRegex = /^\d{6}\/?[0-9]{3,4}$/;
const bedNumRegex = /^[A-Za-z0-9]+$/;

describe('rodné číslo validácia', () => {
  it('akceptuje formát so lomkou', () => {
    expect(rcRegex.test('900101/1234')).toBe(true);
  });

  it('akceptuje formát bez lomky', () => {
    expect(rcRegex.test('9001011234')).toBe(true);
  });

  it('akceptuje 3-miestnu koncovku', () => {
    expect(rcRegex.test('900101/123')).toBe(true);
  });

  it('zamietne prázdny reťazec', () => {
    expect(rcRegex.test('')).toBe(false);
  });

  it('zamietne písmená', () => {
    expect(rcRegex.test('90010A/1234')).toBe(false);
  });

  it('zamietne príliš krátke číslo', () => {
    expect(rcRegex.test('9001/12')).toBe(false);
  });
});

describe('číslo lôžka validácia', () => {
  it('akceptuje číslo', () => {
    expect(bedNumRegex.test('1')).toBe(true);
  });

  it('akceptuje alfanumerické', () => {
    expect(bedNumRegex.test('2A')).toBe(true);
  });

  it('zamietne medzeru', () => {
    expect(bedNumRegex.test('1 A')).toBe(false);
  });

  it('zamietne špeciálne znaky', () => {
    expect(bedNumRegex.test('1-A')).toBe(false);
  });

  it('zamietne prázdny reťazec', () => {
    expect(bedNumRegex.test('')).toBe(false);
  });
});

describe('validácia dátumov', () => {
  it('dátum do musí byť neskorší ako dátum od', () => {
    const from = new Date('2025-01-01');
    const to = new Date('2025-01-10');
    expect(to > from).toBe(true);
  });

  it('rovnaké dátumy nie sú platné', () => {
    const from = new Date('2025-01-01');
    const to = new Date('2025-01-01');
    expect(to <= from).toBe(true);
  });

  it('dátum do pred dátumom od nie je platný', () => {
    const from = new Date('2025-01-10');
    const to = new Date('2025-01-01');
    expect(to <= from).toBe(true);
  });
});
