import { CodeHighlighter } from '~/components/ui/code-highlighter';
import { CodeBlock } from '~/components/ui/codeblock';

import { Cell, CellHeader, Cells } from './story-components';

export function Basic() {
  return (
    <Cells>
      <Cell>
        <CellHeader>JavaScript</CellHeader>
        <CodeBlock
          language="javascript"
          code={`function greet(name) {
  console.log("Hello, " + name + "!");
}

greet("World");`}
        />
      </Cell>

      <Cell>
        <CellHeader>Python</CellHeader>
        <CodeBlock
          language="python"
          code={`def greet(name):
    print(f"Hello, {name}!")

greet("World")`}
        />
      </Cell>

      <Cell>
        <CellHeader>TypeScript</CellHeader>
        <CodeBlock
          language="typescript"
          code={`interface Person {
  name: string;
  age: number;
}

const person: Person = {
  name: "John",
  age: 30
};`}
        />
      </Cell>
    </Cells>
  );
}

export function EdgeCases() {
  return (
    <Cells>
      <Cell>
        <CellHeader>Plain text</CellHeader>
        <CodeBlock language="plaintext" code="No highlighting here." />
      </Cell>
      <Cell>
        <CellHeader>Unsupported language</CellHeader>
        <CodeBlock language="not-a-language" code="Falls back to plain text." />
      </Cell>
      <Cell>
        <CellHeader>Long line</CellHeader>
        <CodeBlock
          language="javascript"
          code={`const message = "${'A long string that does not fit on one line. '.repeat(6)}";`}
        />
      </Cell>
    </Cells>
  );
}

export function HighlighterOnly() {
  return (
    <CodeHighlighter language="typescript" code={`export const answer: number = 42;`}>
      <p class="p-2 text-xs text-muted">CodeHighlighter renders its children below the code.</p>
    </CodeHighlighter>
  );
}
