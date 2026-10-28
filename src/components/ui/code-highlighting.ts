let highlighter: ReturnType<typeof createHighlighter> | undefined;

async function createHighlighter() {
  const [{ createCssVariablesTheme, createHighlighterCore }, { createJavaScriptRegexEngine }] =
    await Promise.all([import('shiki/core'), import('shiki/engine/javascript')]);

  // Reads its colours from the --shiki-* variables of the mounted theme.
  const cssVariablesTheme = createCssVariablesTheme({ name: 'css-variables' });

  return createHighlighterCore({
    themes: [cssVariablesTheme],
    langs: [
      import('shiki/langs/c.mjs'),
      import('shiki/langs/cpp.mjs'),
      import('shiki/langs/csharp.mjs'),
      import('shiki/langs/css.mjs'),
      import('shiki/langs/diff.mjs'),
      import('shiki/langs/dockerfile.mjs'),
      import('shiki/langs/go.mjs'),
      import('shiki/langs/html.mjs'),
      import('shiki/langs/java.mjs'),
      import('shiki/langs/javascript.mjs'),
      import('shiki/langs/json.mjs'),
      import('shiki/langs/jsx.mjs'),
      import('shiki/langs/kotlin.mjs'),
      import('shiki/langs/lua.mjs'),
      import('shiki/langs/markdown.mjs'),
      import('shiki/langs/php.mjs'),
      import('shiki/langs/powershell.mjs'),
      import('shiki/langs/python.mjs'),
      import('shiki/langs/r.mjs'),
      import('shiki/langs/ruby.mjs'),
      import('shiki/langs/rust.mjs'),
      import('shiki/langs/shellscript.mjs'),
      import('shiki/langs/sql.mjs'),
      import('shiki/langs/swift.mjs'),
      import('shiki/langs/toml.mjs'),
      import('shiki/langs/tsx.mjs'),
      import('shiki/langs/typescript.mjs'),
      import('shiki/langs/yaml.mjs'),
    ],
    engine: createJavaScriptRegexEngine(),
  });
}

export async function highlightCode(code: string, language: string) {
  const h = await (highlighter ??= createHighlighter().catch((error) => {
    highlighter = undefined;
    throw error;
  }));
  return h.codeToHtml(code, {
    lang: h.getLoadedLanguages().includes(language) ? language : 'text',
    theme: 'css-variables',
  });
}
