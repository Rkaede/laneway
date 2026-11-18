/**
 * The text of a PDF, page by page. pdf.js is large, so it loads only when a PDF is added, and
 * parses in its own worker.
 */
export async function pdfText(bytes: Uint8Array<ArrayBuffer>) {
  const [pdfjs, { default: workerSrc }] = await Promise.all([
    import('pdfjs-dist'),
    import('pdfjs-dist/build/pdf.worker.min.mjs?url'),
  ]);
  pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;
  // pdf.js takes ownership of the bytes it is given, moving them to its worker.
  const task = pdfjs.getDocument({ data: bytes });
  const pdf = await task.promise;
  try {
    const pages: string[] = [];
    for (let number = 1; number <= pdf.numPages; number++) {
      const page = await pdf.getPage(number);
      const content = await page.getTextContent();
      let text = '';
      for (const item of content.items) {
        if (!('str' in item)) continue;
        text += item.str + (item.hasEOL ? '\n' : '');
      }
      pages.push(text.trim());
      page.cleanup();
    }
    return { text: pages.filter(Boolean).join('\n\n'), pages: pdf.numPages };
  } finally {
    await task.destroy();
  }
}
