import { describe, it, expect } from 'vitest';
import { norm, stem, escQ, escHTML, colorDigits } from '../../src/utils/text.js';

describe('norm()', () => {
  it('lowercases input', () => {
    expect(norm('Olive Oil')).toBe('olive oil');
  });

  it('strips non-alphanumeric characters except spaces', () => {
    expect(norm('jalapeño')).toBe('jalapeo');
    expect(norm("soy sauce / tamari")).toBe('soy sauce  tamari');
  });

  it('trims whitespace', () => {
    expect(norm('  garlic  ')).toBe('garlic');
  });

  it('handles empty string', () => {
    expect(norm('')).toBe('');
  });
});

describe('stem()', () => {
  it('returns short words unchanged', () => {
    expect(stem('oil')).toBe('oil');
    expect(stem('soy')).toBe('soy');
  });

  it('stems -ies to -y', () => {
    expect(stem('curries')).toBe('curry');
    expect(stem('berries')).toBe('berry');
  });

  it('stems -ves to -f', () => {
    expect(stem('halves')).toBe('half');
  });

  it('stems -ing', () => {
    expect(stem('roasting')).toBe('roast');
  });

  it('stems -ed', () => {
    expect(stem('roasted')).toBe('roast');
    expect(stem('diced')).toBe('dic');
  });

  it('stems -es', () => {
    expect(stem('potatoes')).toBe('potato');
    expect(stem('tomatoes')).toBe('tomato');
  });

  it('stems -s', () => {
    expect(stem('burgers')).toBe('burger');
    expect(stem('carrots')).toBe('carrot');
  });

  it('does not over-stem short words', () => {
    expect(stem('peas')).toBe('pea');
    expect(stem('oats')).toBe('oat');
  });
});

describe('escQ()', () => {
  it('escapes single quotes', () => {
    expect(escQ("it's")).toBe("it\\'s");
  });

  it('escapes backslashes', () => {
    expect(escQ('path\\to')).toBe('path\\\\to');
  });

  it('leaves safe strings unchanged', () => {
    expect(escQ('olive oil')).toBe('olive oil');
  });

  it('handles both together', () => {
    expect(escQ("it\\'s")).toBe("it\\\\\\'s");
  });
});

describe('escHTML()', () => {
  it('escapes angle brackets', () => {
    expect(escHTML('<script>alert(1)</script>')).toBe('&lt;script&gt;alert(1)&lt;/script&gt;');
  });

  it('escapes ampersands', () => {
    expect(escHTML('Tom & Jerry')).toBe('Tom &amp; Jerry');
  });

  it('escapes quotes', () => {
    expect(escHTML('"hello" & \'world\'')).toBe('&quot;hello&quot; &amp; &#39;world&#39;');
  });

  it('leaves safe strings unchanged', () => {
    expect(escHTML('olive oil')).toBe('olive oil');
  });

  it('handles empty string', () => {
    expect(escHTML('')).toBe('');
  });

  it('prevents XSS via img onerror', () => {
    const malicious = '<img onerror=alert(1) src=x>';
    const escaped = escHTML(malicious);
    expect(escaped).not.toContain('<img');
    expect(escaped).toContain('&lt;img');
  });
});

describe('colorDigits()', () => {
  it('wraps each digit in a colored span', () => {
    const result = colorDigits(42);
    expect(result).toContain('4');
    expect(result).toContain('2');
    expect(result).toContain('#7C3AED');
    expect(result).toContain('#E65100');
  });

  it('handles single digit', () => {
    const result = colorDigits(7);
    expect(result).toContain('7');
    expect(result).toContain('span');
  });

  it('handles zero', () => {
    const result = colorDigits(0);
    expect(result).toContain('0');
  });
});
