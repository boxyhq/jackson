import Document, { Html, Head, Main, NextScript } from 'next/document';

class MyDocument extends Document {
  render() {
    return (
      <Html lang='en' className='h-full'>
        <Head />
        <body className='h-full antialiased bg-white theme-default dark:bg-gray-900 selection:bg-primary/20 selection:text-secondary'>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}

export default MyDocument;
