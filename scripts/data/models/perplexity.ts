import { ModelProps } from '../../../src/types';

export const perplexity: Partial<ModelProps>[] = [
  { id: 'perplexity/sonar-reasoning-pro', title: 'Sonar Reasoning Pro', reasoning: true },
  { id: 'perplexity/sonar-pro', title: 'Sonar Pro' },
  { id: 'perplexity/sonar-deep-research', title: 'Sonar Deep Research', reasoning: true },
  { id: 'perplexity/sonar-pro-search', title: 'Sonar Pro Search' },
  { id: 'perplexity/sonar-reasoning', title: 'Sonar Reasoning', deprecated: true },
  { id: 'perplexity/sonar', title: 'Sonar' },
];
