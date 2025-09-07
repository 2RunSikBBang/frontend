import { Html, Head, Main, NextScript } from "next/document";
// pages/_document.js

export default function Document() {
  return (
    <Html lang="ko">
      <Head>
        <meta name="color-scheme" content="light" />
        <meta name="theme-color" content="#f5c16c" />
      </Head>
      <body>
        <Main /><NextScript />
      </body>
    </Html>
  );
}
