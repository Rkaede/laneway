import { expect, it } from 'bun:test';

it('starts one animation per text change and continues from the last revealed part', async () => {
  // A separate browser-conditioned process gives the hook Solid's client build, whose effects
  // track what they read, and keeps the motion mock out of the other test files.
  const child = Bun.spawn(
    [
      process.execPath,
      '--conditions=browser',
      '-e',
      String.raw`const { mock } = await import('bun:test');
      const animations = [];
      mock.module('motion', () => ({
        animate(from, to, options) {
          const animation = { from, to, options, stopped: false };
          animations.push(animation);
          return { stop: () => (animation.stopped = true) };
        },
      }));
      const { createRoot, createSignal } = await import('solid-js');
      const { createAnimatedText } = await import(
        ${JSON.stringify(import.meta.resolve('./create-animated-text'))}
      );

      const [text, setText] = createSignal('one two three');
      const hook = createRoot(() => createAnimatedText(text, { type: 'word' }));
      const state = () => ({
        animations: animations.map(({ from, to, stopped }) => ({ from, to, stopped })),
        animatedText: hook.animatedText(),
        isAnimating: hook.isAnimating(),
      });

      for (const progress of [1.2, 2.4, 3.6]) animations.at(-1).options.onUpdate(progress);
      const afterThreeFrames = state();
      setText('one two three four five');
      const afterChangeMidAnimation = state();
      animations.at(-1).options.onComplete();
      const afterCompletion = state();
      setText('one two three four five six');
      const afterNextChange = state();

      console.log(JSON.stringify({
        afterThreeFrames,
        afterChangeMidAnimation,
        afterCompletion,
        afterNextChange,
      }));`,
    ],
    { cwd: import.meta.dir, stdout: 'pipe', stderr: 'pipe' },
  );
  const [exitCode, stdout, stderr] = await Promise.all([
    child.exited,
    new Response(child.stdout).text(),
    new Response(child.stderr).text(),
  ]);

  expect(exitCode, stderr).toBe(0);
  const first = { from: 0, to: 5 };
  const second = { from: 3, to: 9 };
  const third = { from: 9, to: 11 };
  expect(JSON.parse(stdout)).toEqual({
    afterThreeFrames: {
      animations: [{ ...first, stopped: false }],
      animatedText: 'one two',
      isAnimating: true,
    },
    afterChangeMidAnimation: {
      animations: [
        { ...first, stopped: true },
        { ...second, stopped: false },
      ],
      animatedText: 'one two',
      isAnimating: true,
    },
    afterCompletion: {
      animations: [
        { ...first, stopped: true },
        { ...second, stopped: false },
      ],
      animatedText: 'one two three four five',
      isAnimating: false,
    },
    afterNextChange: {
      animations: [
        { ...first, stopped: true },
        { ...second, stopped: true },
        { ...third, stopped: false },
      ],
      animatedText: 'one two three four five',
      isAnimating: true,
    },
  });
});
