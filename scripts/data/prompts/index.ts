import fs from 'fs';
import path from 'path';

function readFile(filePath: string) {
  return fs.readFileSync(path.join(__dirname, filePath), 'utf-8');
}

const codingSeaBodybuilder3943 = readFile('./coding-sea-bodybuilder-3943.md');
const flashcards = readFile('./flashcards.md');
const succinct = readFile('./succinct.md');

export const prompts = {
  succinct: {
    description:
      'Natural voice that is succinct, clear, professional, matter-of-fact, with no buzzwords or exaggeration',
    systemPrompt: succinct,
  },
  flashcards: {
    description:
      'Create Anki flashcards from a given text, following three key principles: the minimum information principle, optimized wording, and no external context.',
    systemPrompt: flashcards,
  },
  codingSeaBodybuilder3943: {
    description:
      'https://www.reddit.com/r/PromptEngineering/comments/1eogo2a/coding_system_prompt/lhjqhry/',
    systemPrompt: codingSeaBodybuilder3943,
  },
};
