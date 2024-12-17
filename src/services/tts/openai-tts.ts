import { apiKeys } from '~/store/keys';

export async function generateSpeech(content: string, voice: string = 'alloy') {
  const apiKey = apiKeys?.openai;
  if (!apiKey) {
    throw new Error('No OpenAI API key found');
  }

  const response = await fetch('https://api.openai.com/v1/audio/speech', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'tts-1',
      input: content,
      voice,
      reponse_format: 'mp3',
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`HTTP error! status: ${response.status}, ${JSON.stringify(error)}`);
  }

  const audioBuffer = await response.arrayBuffer();
  return audioBuffer;
}
