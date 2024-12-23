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
