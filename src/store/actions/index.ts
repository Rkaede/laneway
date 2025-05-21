export * from './assistants';
export * from './navigation-actions';
export * from './presets';
export * from './session-actions';
export * from './ui-actions';

import { navigationActions } from './navigation-actions';
import { sessionActions } from './session-actions';
import { uiActions } from './ui-actions';

export const actions = {
  ...sessionActions,
  ...uiActions,
  ...navigationActions,
};
