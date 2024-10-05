import fs from 'fs/promises';
import path from 'path';

import { assistants } from './data/assistants';
import { generateModels } from './data/models';
import { presets } from './data/presets';

async function main() {
  const models = await generateModels();
  const publicDir = path.join(process.cwd(), 'public');
  const modelsPath = path.join(publicDir, 'models.json');
  const presetsPath = path.join(publicDir, 'presets.json');
  const assistantsPath = path.join(publicDir, 'assistants.json');

  try {
    await fs.mkdir(publicDir, { recursive: true });
    await fs.writeFile(modelsPath, JSON.stringify(models, null, 2));
    await fs.writeFile(assistantsPath, JSON.stringify(assistants, null, 2));
    await fs.writeFile(presetsPath, JSON.stringify(presets, null, 2));

    console.log(`Models written to ${modelsPath}`);
  } catch (err) {
    console.error('Error writing models to file:', err);
  }
}

main().catch((err) => {
  console.error('Error generating models:', err);
});
