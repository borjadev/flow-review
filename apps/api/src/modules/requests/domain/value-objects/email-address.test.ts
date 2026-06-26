import { describe, expect, it } from 'vitest';
import { EmailAddress, InvalidEmailError } from './email-address.js';

describe('EmailAddress', () => {
  it('normalizes by trimming and lowercasing', () => {
    expect(EmailAddress.of('  Jane@Example.COM ').value).toBe('jane@example.com');
  });

  it.each(['not-an-email', 'jane@', '@example.com', 'jane example.com', ''])(
    'rejects invalid address "%s"',
    (value) => {
      expect(() => EmailAddress.of(value)).toThrow(InvalidEmailError);
    },
  );

  it('compares by value', () => {
    expect(EmailAddress.of('a@b.com').equals(EmailAddress.of('A@B.com'))).toBe(true);
  });
});
