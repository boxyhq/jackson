import { Injectable } from '@angular/core';

import 'prismjs';
import 'prismjs/plugins/line-numbers/prism-line-numbers';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-java';
import 'prismjs/components/prism-markup';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-sass';
import 'prismjs/components/prism-scss';

declare let Prism: any;

@Injectable({
  providedIn: 'root',
})
export class PrismService {
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  constructor() {}

  highlightAll() {
    Prism.highlightAll();
  }

  convertHtmlIntoString(text: string) {
    return text.replace(new RegExp('&', 'g'), '&amp;').replace(new RegExp('<', 'g'), '&lt;');
  }
}
