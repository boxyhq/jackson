import path from 'node:path';
import { copyFileSync, existsSync, mkdirSync } from 'node:fs';

const TERMINUS_PATH = path.join('public', 'terminus');

if (!existsSync(TERMINUS_PATH)) {
  mkdirSync(TERMINUS_PATH, { recursive: true });
}
const folders = [
  {
    src: path.join('node_modules', 'blockly', 'media', 'sprites.png'),
    dst: path.join(TERMINUS_PATH, 'sprites.png'),
  },
];

try {
  folders.forEach(({ src, dst }) => copyFileSync(src, dst));
  console.log(`copied public assets under terminus`);
} catch (err) {
  console.error(`failed copying public assets to terminus folder`, err);
}
