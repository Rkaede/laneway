export function sanitizeMarkdownLink(href: string) {
  try {
    const { protocol } = new URL(href, 'https://laneway.invalid');
    return ['http:', 'https:', 'mailto:', 'tel:'].includes(protocol) ? href : '';
  } catch {
    return '';
  }
}
