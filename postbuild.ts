import { cpSync } from 'node:fs';

const folders = [
  { src: 'public', dst: '.next/standalone/public' },
  { src: '.next/static', dst: '.next/standalone/.next/static' },
];

try {
  folders.forEach(({ src, dst }) => cpSync(src, dst, { recursive: true }));
  console.log(`moved public/static assets to standalone build`);
} catch (err) {
  console.error(`failed moving public/static to standalone build`, err);
}
