import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { execFileSync } from 'child_process';
import { mkdtemp, rm, stat, writeFile } from 'fs/promises';
import { tmpdir } from 'os';
import { join, resolve } from 'path';

let directory: string;

beforeEach(async () => {
  directory = await mkdtemp(join(tmpdir(), 'laneway-verify-commit-'));
  execFileSync('git', ['init', '--quiet', directory]);
});

afterEach(() => rm(directory, { recursive: true, force: true }));

async function runVerifier(message: string, cwd = directory) {
  const messagePath = execFileSync('git', ['rev-parse', '--git-path', 'COMMIT_EDITMSG'], {
    cwd,
    encoding: 'utf-8',
  }).trim();
  await writeFile(resolve(cwd, messagePath), message);
  const child = Bun.spawn(['bun', join(import.meta.dir, 'verify-commit.js')], {
    cwd,
    stdout: 'pipe',
    stderr: 'pipe',
  });
  const [exitCode, stdout, stderr] = await Promise.all([
    child.exited,
    new Response(child.stdout).text(),
    new Response(child.stderr).text(),
  ]);
  return { exitCode, stdout, stderr };
}

describe('verify-commit', () => {
  it.each([
    'fix: correct a bug',
    'feat!: change the public API',
    'feat(chat)!: change the public API',
    'test(models): cover catalogue references [BT4]',
    'revert: feat(chat): add streaming',
    'revert: feat(chat)!: change the public API',
    '\n  docs: update setup\n\nExplain the change in the body.\n',
    `fix: correct a bug\r\n\r\n${'Long body. '.repeat(10)}`,
  ])('accepts a conventional message: %s', async (message) => {
    const result = await runVerifier(message);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toBe('');
    expect(result.stderr).toBe('');
  });

  it.each([
    '',
    'Update documentation',
    'unknown: add something',
    'fix:',
    'fix:\ncorrect a bug',
    'fix(chat):missing space',
    'feat(chat)!!: change the public API',
    `fix(chat): ${'a'.repeat(51)}): short`,
  ])('rejects a malformed message: %s', async (message) => {
    const result = await runVerifier(message);

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain('ERROR invalid commit message format.');
    expect(result.stderr).toContain('Proper commit message format is required');
  });

  it.each(['fix', 'fix(chat)', 'feat!', 'feat(chat)!', 'revert: feat(chat)!'])(
    'limits the description to 50 characters: %s',
    async (prefix) => {
      expect((await runVerifier(`${prefix}: ${'a'.repeat(50)}`)).exitCode).toBe(0);
      expect((await runVerifier(`${prefix}: ${'a'.repeat(51)}`)).exitCode).toBe(1);
    },
  );

  it.each([
    "Merge branch 'next'",
    "Merge remote-tracking branch 'origin/next'",
    'Merge pull request #123 from corey/feature/chat',
    `Merge branch '${'long-branch-name-'.repeat(5)}'\n\nExplain the merge.`,
  ])('accepts a merge message: %s', async (message) => {
    const result = await runVerifier(message);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toBe('');
    expect(result.stderr).toBe('');
  });

  it.each([
    {
      message: 'fix(worktree): validate the linked message',
      mainMessage: 'Invalid',
      exitCode: 0,
    },
    { message: 'Invalid', mainMessage: 'fix: valid main message', exitCode: 1 },
  ])('validates the linked worktree message with exit code $exitCode', async (testCase) => {
    execFileSync(
      'git',
      [
        '-c',
        'user.name=Laneway Tests',
        '-c',
        'user.email=tests@example.com',
        '-c',
        'commit.gpgsign=false',
        '-c',
        'core.hooksPath=/dev/null',
        'commit',
        '--quiet',
        '--allow-empty',
        '-m',
        'test: initialize fixture',
      ],
      { cwd: directory },
    );
    const worktree = join(directory, 'linked');
    execFileSync('git', ['worktree', 'add', '--quiet', '--detach', worktree], {
      cwd: directory,
    });
    await writeFile(join(directory, '.git', 'COMMIT_EDITMSG'), testCase.mainMessage);

    expect((await stat(join(worktree, '.git'))).isFile()).toBe(true);

    const result = await runVerifier(testCase.message, worktree);

    expect(result.exitCode).toBe(testCase.exitCode);
    if (testCase.exitCode === 0) {
      expect(result.stderr).toBe('');
    } else {
      expect(result.stderr).toContain('ERROR invalid commit message format.');
    }
  });
});
