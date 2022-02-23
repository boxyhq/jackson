import Document, { Html, Head, Main, NextScript } from 'next/document';

class MyDocument extends Document {
  render() {
    return (
      <Html lang='en' className='h-full'>
        <Head />
        <body className='theme-default h-full bg-white antialiased selection:bg-primary/20 selection:text-secondary dark:bg-gray-900'>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}

export default MyDocument;
