import { createEffect, createSignal, For } from 'solid-js';

import { CodeBlock, TextEditor } from '~/components/ui';
import { imageCache } from '~/services/image-cache';
import { store } from '~/store';

const config = {
  richtexteditor: true,
  imageCache: false,
  state: true,
};

export default function Debug() {
  return (
    <div class="h-full overflow-auto px-10 py-4 text-sm">
      {config.richtexteditor && (
        <div>
          <TextEditor />
          {/* <RichTextEditorExample /> */}
        </div>
      )}
      {config.imageCache && <ImageCache />}
      {config.state && (
        <div class="w-full">
          <CodeBlock language="json" code={JSON.stringify(store, null, 2)} />
        </div>
      )}
    </div>
  );
}

function ImageCache() {
  const [images, setImages] = createSignal<{ url: string; blob: Blob }[]>([]);

  const fetchImages = async () => {
    const cache = await caches.open('laneway-image-cache');
    const keys = await cache.keys();

    const imageData = await Promise.all(
      keys.map(async (key) => {
        const blob = await imageCache.get(key.url);
        return blob ? { url: key.url, blob } : null;
      }),
    );

    setImages(imageData.filter((img): img is { url: string; blob: Blob } => img !== null));
  };

  createEffect(() => {
    fetchImages();
  });

  const deleteImage = async (url: string) => {
    await imageCache.remove(url);
    fetchImages();
  };

  return (
    <div class="grid grid-cols-6">
      <For each={images()}>
        {(image) => (
          <div class="flex flex-col items-center">
            <img
              src={URL.createObjectURL(image.blob)}
              alt="Cached image"
              class="h-auto max-w-32 rounded-lg shadow-md"
            />
            <p class="mt-2 w-full truncate text-center text-xs text-gray-500">{image.url}</p>
            <button
              class="mt-2 rounded bg-red-500 px-2 py-1 text-xs text-white hover:bg-red-600"
              onClick={() => deleteImage(image.url)}
            >
              Delete
            </button>
          </div>
        )}
      </For>
    </div>
  );
}
