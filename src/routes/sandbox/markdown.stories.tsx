import Markdown from '~/components/ui/markdown';

export function Text() {
  return (
    <Markdown
      text={`# Heading 1
## Heading 2
### Heading 3

A paragraph with **bold**, *italic*, ~~strikethrough~~ and \`inline code\`.

> A block quote.

---

Text after a rule.`}
    />
  );
}

export function Lists() {
  return (
    <Markdown
      text={`- First
- Second
  - Nested

1. One
2. Two

- [x] Done
- [ ] To do`}
    />
  );
}

export function Code() {
  return (
    <Markdown
      text={`Inline \`const x = 1\` and a block:

\`\`\`ts
export function add(a: number, b: number) {
  return a + b;
}
\`\`\`

A block without a language:

\`\`\`
plain text
\`\`\``}
    />
  );
}

export function Table() {
  return (
    <Markdown
      text={`| Model | Input | Output |
| :--- | ---: | ---: |
| Small | $0.10 | $0.40 |
| Large | $3.00 | $15.00 |`}
    />
  );
}

export function Links() {
  return (
    <Markdown
      text={`An [external link](https://openrouter.ai), which opens in a new tab.

A [relative link](/sandbox/markdown), which stays in this tab.

A [javascript: link](javascript:alert(1)), which is stripped to plain text.`}
    />
  );
}

export function Images() {
  return (
    <Markdown text="Images render their alt text: ![a sample image](https://example.com/a.png)" />
  );
}
