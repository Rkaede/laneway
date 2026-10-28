import { describe, expect, it } from 'bun:test';

import { sanitizeMarkdownLink } from './markdown-links';

describe('sanitizeMarkdownLink', () => {
  it.each([
    'https://example.com/guide?q=chat#links',
    'http://example.com',
    'HTTPS://example.com',
    'mailto:hello@example.com',
    'tel:+61312345678',
    '//example.com/guide',
    '/session/example',
    './guide',
    '../guide',
    'guide',
    '#heading',
    '?page=2',
    '',
  ])('preserves safe links: %j', (href) => {
    expect(sanitizeMarkdownLink(href)).toBe(href);
  });

  it.each([
    'javascript:alert(1)',
    'JaVaScRiPt:alert(1)',
    ' javascript:alert(1)',
    '\u0000javascript:alert(1)',
    'java\tscript:alert(1)',
    'java\nscript:alert(1)',
    'java\rscript:alert(1)',
    'data:text/html,<script>alert(1)</script>',
    'vbscript:msgbox(1)',
    'blob:https://example.com/123',
    'file:///etc/passwd',
    'ftp://example.com/file',
    'custom:example',
    'https://[invalid',
    'http://',
  ])('blocks unsafe or invalid links: %j', (href) => {
    expect(sanitizeMarkdownLink(href)).toBe('');
  });
});
