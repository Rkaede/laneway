import { expect, it } from 'bun:test';

it('defers LLM SDK loading until a request and supports text and streaming', async () => {
  const child = Bun.spawn(
    [
      process.execPath,
      '--preload',
      import.meta.resolve('../test/setup'),
      '-e',
      String.raw`globalThis.self = globalThis;
      globalThis.fetch = async () => Response.json([]);
      await import(${JSON.stringify(import.meta.resolve('../hooks/use-chat'))});
      await import(${JSON.stringify(import.meta.resolve('../store/actions/session-actions'))});
      await Bun.sleep(0);
      const loadedOnStartup = Object.keys(require.cache).filter(
        (name) => name.endsWith('/services/llm.ts') ||
          name.includes('/node_modules/ai/') || name.includes('/node_modules/@ai-sdk/'),
      );
      const llm = await import(${JSON.stringify(import.meta.resolve('./llm'))});
      const generationSDKLoaded = () => Object.keys(require.cache).some(
        (name) => name.includes('/node_modules/ai/'),
      );
      const loadedBeforeRequest = generationSDKLoaded();
      const { setApiKeys } = await import(${JSON.stringify(import.meta.resolve('../store/keys'))});
      setApiKeys('openai', 'test-key');
      globalThis.fetch = async (_url, options) => {
        const { stream } = JSON.parse(options.body);
        const choices = [{
          index: 0,
          finish_reason: 'stop',
          ...(stream ? { delta: { content: 'Loaded response' } } : {
            message: { role: 'assistant', content: 'Loaded response' },
          }),
        }];
        if (!stream) return Response.json({ choices });
        return new Response('data: ' + JSON.stringify({ choices }) + '\n\ndata: [DONE]\n\n', {
          headers: { 'content-type': 'text/event-stream' },
        });
      };
      const messages = [{ id: 'prompt', role: 'user', content: 'Hello' }];
      const [text, stream] = await Promise.all([
        llm.getText({ messages, modelId: 'test-model', provider: 'openai' }),
        llm.getStream(messages, 'test-model', 'openai'),
      ]);
      let streamedText = '';
      for await (const part of stream.textStream) streamedText += part;
      console.log(JSON.stringify({
        loadedOnStartup,
        loadedBeforeRequest,
        loadedAfterRequest: generationSDKLoaded(),
        text: text.text,
        streamedText,
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
  expect(JSON.parse(stdout)).toEqual({
    loadedOnStartup: [],
    loadedBeforeRequest: false,
    loadedAfterRequest: true,
    text: 'Loaded response',
    streamedText: 'Loaded response',
  });
});
