# vite-pages library starter

This is a demo project for [vite-plugin-react-pages](https://github.com/vitejs/vite-plugin-react-pages).
This project demonstrate how to develop a library using vite as your local develop environment.

Notice that we put the **whole** vite-pages project (including config, index.html, .etc) into a sub folder. It makes the root directory cleaner. **This is a neat way to "embed" a vite-pages document project inside your main project.**

You can run this demo in [StackBlitz](https://stackblitz.com/fork/github/vitejs/vite-plugin-react-pages/tree/main/packages/create-project/template-lib?file=README.md&terminal=dev), entirely in your browser!

## How to use

`npm install` or `pnpm install` or `yarn`

`npm run dev` You can play with docs and demos of your packages in local develop environment.

> **Notice the "Components" navigation at the top bar!**

Edit `src/Button/index.tsx` or other source files, the demos will inflect your change instantly.
Edit `src/Button/demos/demo1.tsx` or other demo files, the demos will inflect your change instantly.

`npm run build-docs` The demos are built and served.

`npm run ssr-docs` The app are built into a static site (Static-Site Generation) and served.

`npm run build-lib` Build the library for publishing.

---

Checkout [vite-plugin-react-pages](https://github.com/vitejs/vite-plugin-react-pages) for more info.
