// modified from vuejs/core
// https://github.com/vuejs/core/blob/main/scripts/verify-commit.js

// @ts-check
import { readFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const msgPath = path.resolve('.git/COMMIT_EDITMSG');
const msg = readFileSync(msgPath, 'utf-8').trim();

const commitRE =
  /^(revert: )?(feat|fix|docs|dx|style|refactor|perf|test|workflow|build|ci|chore|types|wip|release)(\(.+\))?: .{1,50}/;

if (!commitRE.test(msg)) {
  console.log();
  console.error(
    `  ERROR invalid commit message format.\n\n` +
      `  Proper commit message format is required for automated changelog generation. Examples:\n\n` +
      `    feat(pencil): add 'graphiteWidth' option\n` +
      `    fix(graphite): stop graphite breaking when width < 0\n`,
  );
  process.exit(1);
}
