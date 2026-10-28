import { mock } from 'bun:test';

import { iconsMock } from './icons-mock';

mock.module('~/components/icons/ui', iconsMock);
