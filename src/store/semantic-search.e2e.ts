import { expect, type Page, test } from '@playwright/test';

const DIMENSIONS = 512;

/** Text about baking points one way and everything else another, standing in for real embeddings. */
function fakeEmbedding(text: string) {
  const baking = /sourdough|starter|loaf|bread|crust|bake/i.test(text);
  const vector = Array(DIMENSIONS).fill(0);
  vector[baking ? 0 : 1] = 1;
  return vector;
}

async function addSession(page: Page) {
  await page.evaluate(async () => {
    const storePath = '/src/store/index.tsx';
    const { setStore, store }: typeof import('./index') = await import(
      /* @vite-ignore */ storePath
    );
    setStore('settings', 'hasSeenWelcome', true);
    setStore('chats', [
      ...store.chats,
      {
        id: 'baking-chat',
        sessionId: 'baking',
        status: 'idle',
        modelId: store.settings.defaultSession.id,
        messages: [
          { id: 'baking-q', role: 'user', content: 'My sourdough starter is finally bubbly.' },
          { id: 'baking-a', role: 'assistant', content: 'Great, feed it before you mix.' },
        ],
      },
    ] as typeof store.chats);
    setStore('sessions', [
      ...store.sessions,
      {
        id: 'baking',
        title: 'Weekend project',
        type: 'chat',
        created: Date.now(),
        chats: ['baking-chat'],
      },
    ]);
  });
}

test('turns on semantic search with a cost estimate, then finds chats by meaning', async ({
  page,
}) => {
  const embedded: string[] = [];
  await page.route('https://openrouter.ai/api/v1/embeddings', async (route) => {
    const body = route.request().postDataJSON() as { input: string[]; dimensions: number };
    expect(body.dimensions).toBe(DIMENSIONS);
    embedded.push(...body.input);
    await route.fulfill({
      json: {
        object: 'list',
        data: body.input.map((text, index) => ({
          object: 'embedding',
          index,
          embedding: fakeEmbedding(text),
        })),
        usage: { prompt_tokens: 1, total_tokens: 1 },
      },
    });
  });

  await page.goto('/');
  await addSession(page);
  await page.goto('/settings');
  const section = page.locator('section', {
    has: page.getByRole('heading', { name: 'Search' }),
  });
  const toggle = section.getByRole('switch', { name: 'Semantic search' });
  await expect(toggle).toBeDisabled();

  await page.evaluate(async () => {
    const keysPath = '/src/store/keys.tsx';
    const { setApiKeys }: typeof import('./keys') = await import(/* @vite-ignore */ keysPath);
    setApiKeys('openrouter', 'sk-or-test');
  });
  await expect(section.getByRole('status')).toContainText(
    'Indexing your current data would use',
  );
  expect(embedded).toEqual([]);

  let estimate = '';
  page.once('dialog', (dialog) => {
    estimate = dialog.message();
    void dialog.accept();
  });
  // The switch's input is visually hidden, so it is toggled from the keyboard.
  await toggle.focus();
  await page.keyboard.press('Space');
  await expect(toggle).toBeChecked();
  expect(estimate).toMatch(/about [\d,]+ tokens/);
  await expect(section.getByRole('status')).toHaveText(/^[\d,]+ passages indexed\.$/);
  expect(embedded).toContain('My sourdough starter is finally bubbly.');

  // No word of the query is in the chat; only its meaning matches.
  await page.keyboard.press('ControlOrMeta+k');
  await page.getByPlaceholder(/Search chats, notes/).fill('crusty loaf');
  const result = page.getByRole('option', { name: /Weekend project/ });
  await expect(result).toBeVisible();
  await expect(result).toContainText('My sourdough starter');
  await result.click();
  await expect(page).toHaveURL(/\/session\/baking$/);
});

test('finds library documents from the command menu and opens the matching passage', async ({
  page,
}) => {
  await page.goto('/library');
  const text = [
    'Introduction to the handbook.',
    'x '.repeat(900),
    'The kiln reaches 1300 degrees.',
  ];
  await page.getByLabel('Document files').setInputFiles({
    name: 'Pottery Handbook.md',
    mimeType: 'text/markdown',
    buffer: Buffer.from(text.join('\n\n')),
  });
  await expect(page.getByRole('link', { name: 'Pottery Handbook' })).toBeVisible();

  await page.keyboard.press('ControlOrMeta+k');
  await page.getByPlaceholder(/Search chats, notes/).fill('kiln');
  const result = page.getByRole('option', { name: /Pottery Handbook/ });
  await expect(result).toBeVisible();
  await expect(result).toContainText('kiln');
  await result.click();

  await expect(page).toHaveURL(/\/library\/[\w-]+$/);
  await expect(page.getByText('The kiln reaches 1300 degrees.')).toBeInViewport();
});
