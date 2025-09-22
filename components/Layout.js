// components/Layout.js
import Head from "next/head";
import Link from "next/link";
import Image from "next/image";

export default function Layout({ children, title, description }) {
  const siteName = "이런식빵";
  const defaultTitle = title || "이런식빵 — 강원대 배달";
  const defaultDesc =
    description || "따끈한 식빵 배달! 지금 주문하고 빠르게 받아보세요.";

  // 배포 환경에서 절대경로가 되도록 (Vercel 환경변수에 설정 권장)
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "";
  const ogImage = baseUrl ? `${baseUrl}/logo.png` : "/logo.png";

  return (
    <div className="min-h-screen bg-[#f9f1db] text-neutral-900 antialiased flex flex-col items-center">
      <Head>
        <title>{defaultTitle}</title>
        <meta name="description" content={defaultDesc} />

        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content={siteName} />
        <meta property="og:title" content={defaultTitle} />
        <meta property="og:description" content={defaultDesc} />
        {baseUrl && <meta property="og:url" content={baseUrl} />}
        <meta property="og:image" content={ogImage} key="og:image" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={defaultTitle} />
        <meta name="twitter:description" content={defaultDesc} />
        <meta name="twitter:image" content={ogImage} key="twitter:image" />

        {/* 파비콘(Optional) */}
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {/* 헤더 */}
      <header className="w-full bg-[#f5c16c] p-4 text-center font-bold text-lg flex items-center justify-center relative">
        {/* 왼쪽: 개발자 */}
        <span className="absolute left-4 text-xs">개발: 윤준석, 김유미</span>

        {/* 가운데: 로고 + 이름 */}
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

        {/* 오른쪽: 기획 */}
        <span className="absolute right-4 text-xs">기획: 송치호</span>
      </header>

      {/* 본문 */}
      <main className="w-full max-w-md p-4 flex-1">{children}</main>

      {/* 푸터 */}
      <footer className="w-full bg-[#f5c16c] p-2 text-center text-xs text-gray-700">
        © 2025 이런식빵. All Rights Reserved.
        <span className="mx-1">·</span>
        <Link href="/privacy" className="underline">
          개인정보처리방침
        </Link>
      </footer>
    </div>
  );
}
