// components/Layout.js
import Head from "next/head";
import Link from "next/link";
import Image from "next/image";

const BASE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "").replace(/\/$/, "");
const shareImage = (BASE_URL ? `${BASE_URL}/og-card.png` : "/og-card.png") + "?v=3";

const SITE_TITLE = "이런식빵";
const SITE_DESC = "강원대 춘천캠 배달 간식, 이런식빵 🍞";

export default function Layout({ children }) {
  return (
    <div className="min-h-screen bg-[#f9f1db] text-neutral-900 antialiased flex flex-col items-center">
      <Head>
        <title>{SITE_TITLE}</title>
        <meta name="description" content={SITE_DESC} />
        <link rel="icon" href="/favicon.ico" />

        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content={SITE_TITLE} />
        <meta property="og:description" content={SITE_DESC} />
        {BASE_URL && <meta property="og:url" content={BASE_URL} />}
        <meta property="og:image" content={shareImage} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={SITE_TITLE} />
        <meta name="twitter:description" content={SITE_DESC} />
        <meta name="twitter:image" content={shareImage} />
      </Head>

      {/* 헤더 */}
      <header className="w-full bg-[#f5c16c] p-4 text-center font-bold text-lg flex items-center justify-center relative">
        <span className="absolute left-4 text-xs">개발: 윤준석, 김유미</span>

        <div className="flex items-center gap-2">
          <Image
            src="/logo.png"
            alt="ThisWay Bread"
            width={128}
            height={32}
            className="h-8 w-auto"
            priority
          />
          <span className="font-bold text-lg">이런식빵</span>
        </div>

        <span className="absolute right-4 text-xs">기획: 송치호</span>
      </header>

      <main className="w-full max-w-md p-4 flex-1">{children}</main>

      <footer className="w-full bg-[#f5c16c] p-2 text-center text-xs text-gray-700">
        © 2025 이런식빵. All Rights Reserved.
        <span className="mx-1">·</span>
        <Link href="/privacy" className="underline">개인정보처리방침</Link>
      </footer>
    </div>
  );
}
