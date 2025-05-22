// https://christopher.engineering/en/blog/lucide-icons-with-vite-dev-server/
declare module 'lucide-solid/icons/*' {
  import { LucideProps } from 'lucide-solid/dist/types/types';
  import { Component } from 'solid-js';
  const cmp: Component<LucideProps>;

  export = cmp;
}
