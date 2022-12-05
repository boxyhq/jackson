---
title: Button title
subGroup: general
---

# Button

This is a **markdown** document of the `Button` component.

You can put this page in a subGroup of the side menu using `staticData.subGroup`.

## Demos

You can import demos like this:

<Demo src="./demos/demo1.tsx" />

<Demo src="./demos/demo2.tsx" />

## Extract API info from Typescript code

You can extract API from Typescript interface and render it into page.

The following markdown

```tsx
<TsInfo src='./types.ts' name='ButtonProps' />
```

> The `name` should be the export name of the Typescript interface.

will result in:

<TsInfo src="./types.ts" name="ButtonProps" />

In jsx page, You can render TsInfo like this:

```tsx
import tsInfoData from './types.ts?tsInfo=ButtonProps';
import { TsInfo } from 'vite-pages-theme-doc';

export default function Page() {
  return <TsInfo {...tsInfoData} />;
}
```

## Render text from files

You can also render text from any files. So that these files can be both "code" and "documentation".

The following markdown

```tsx
<FileText src='./types.ts' syntax='ts' />
```

will result in:

<FileText src="./types.ts" syntax="ts" />

In jsx page, You can render file text like this:

```tsx
// https://vitejs.dev/guide/assets.html#importing-asset-as-string
import text from './types.ts?raw';
import { FileText } from 'vite-pages-theme-doc';

export default function Page() {
  return <FileText text={text} syntax='ts' />;
}
```
