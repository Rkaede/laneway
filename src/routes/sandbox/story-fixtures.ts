import { icons } from '~/components/ui/badge';

// The roles that Badge, IconBadge and Tag share. Badge must have an icon for every role, so the
// keys of its icon map are the full list.
export const ROLES = Object.keys(icons) as Array<keyof typeof icons>;

// Stories render against the real model catalogue, so they use models that are still listed.
export const MODEL_IDS = {
  openai: 'openai/gpt-6.1-terra',
  anthropic: 'anthropic/claude-sonnet-5.5',
  google: 'google/gemini-2.5-flash',
  noVision: 'openai/gpt-4',
  free: 'aperture/glados',
  search: 'perplexity/sonar-pro-search',
  reasoning: 'perplexity/sonar-reasoning-pro',
} as const;

function sampleSvg(label: string, background: string) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800"><rect width="100%" height="100%" fill="${background}"/><text x="50%" y="50%" fill="#ffffff" font-family="sans-serif" font-size="96" text-anchor="middle" dominant-baseline="middle">${label}</text></svg>`;
}

// Inline images, so image stories work offline and do not depend on a third-party host.
export function sampleImageUrl(label: string, background = '#6d6a8a') {
  return `data:image/svg+xml,${encodeURIComponent(sampleSvg(label, background))}`;
}

export function sampleImageFile(label: string, background = '#6d6a8a') {
  return new File([sampleSvg(label, background)], `${label.toLowerCase()}.svg`, {
    type: 'image/svg+xml',
  });
}
