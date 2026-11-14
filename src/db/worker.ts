import { worker } from '@electric-sql/pglite/worker';

import { createDatabase } from './create';

// Every tab starts this worker, but only the elected leader opens the database. The other tabs send
// their queries to the leader, and a new leader takes over when its tab closes.
worker({ init: (options) => createDatabase(options.dataDir) });
