import { expect, test } from '@playwright/test';

const speechModels = [
  { id: 'deepgram/aura-2', title: 'Aura-2', voices: ['aura-2-thalia-en'], price: 0.00003 },
  {
    id: 'hexgrad/kokoro-82m',
    title: 'Kokoro 82M',
    voices: ['af_bella', 'af_heart'],
    price: 0.00000062,
  },
];

test('picks an OpenRouter speech model and voice, and previews them', async ({ page }) => {
  await page.route('**/speech-models.json', (route) => route.fulfill({ json: speechModels }));
  const requests: Record<string, unknown>[] = [];
  await page.route('https://openrouter.ai/api/v1/audio/speech', (route) => {
    requests.push(route.request().postDataJSON());
    return route.fulfill({
      status: 200,
      contentType: 'audio/mpeg',
      body: Buffer.from([0x49, 0x44, 0x33, 0x04, 0, 0, 0, 0, 0, 0]),
    });
  });

  await page.goto('/settings');
  const modelPicker = page.getByRole('button', { name: 'Speech model' });
  await expect(modelPicker).toBeDisabled();
  await expect(page.getByText('OpenRouter API key not configured')).toBeVisible();

  await page.evaluate(async () => {
    const keysPath = '/src/store/keys.tsx';
    const { setApiKeys }: typeof import('../../store/keys') = await import(
      /* @vite-ignore */ keysPath
    );
    setApiKeys('openrouter', 'sk-or-test');
  });

  await expect(modelPicker).toHaveText(/Kokoro 82M/);
  await expect(page.getByRole('button', { name: 'Voice' })).toHaveText(/af_heart/);

  await modelPicker.click();
  await page.getByRole('option', { name: /Aura-2/ }).click();
  await expect(modelPicker).toHaveText(/Aura-2/);
  // af_heart is not an Aura voice, so the picker moves to the model's first voice.
  await expect(page.getByRole('button', { name: 'Voice' })).toHaveText(/aura-2-thalia-en/);

  await page.getByRole('button', { name: 'Preview' }).click();
  await expect.poll(() => requests.length).toBe(1);
  expect(requests[0]).toMatchObject({
    model: 'deepgram/aura-2',
    voice: 'aura-2-thalia-en',
    response_format: 'mp3',
    input: expect.stringContaining('This is how replies will sound'),
  });
});
