export * from './assistants';
export * from './presets';
export * from './session-actions';
export * from './ui-actions';
export * from './navigation-actions';

import { sessionActions } from './session-actions';
import { uiActions } from './ui-actions';
import { navigationActions } from './navigation-actions';

export const actions = {
  ...sessionActions,
  ...uiActions,
  ...navigationActions,
};
