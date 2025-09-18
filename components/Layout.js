import Link from "next/link";
import Image from "next/image";

export default function Layout({ children }) {
  return (
    <div className="min-h-screen bg-[#f9f1db] text-neutral-900 antialiased flex flex-col items-center">
      {/* 헤더 */}
      <header className="w-full bg-[#f5c16c] p-4 text-center font-bold text-lg flex items-center justify-center relative">
        {/* 왼쪽: 개발자 */}
        <span className="absolute left-4 text-xs">개발: 윤준석, 김유미</span>

        {/* 가운데: 로고 + 이름 */}
        <Image
  src="/logo.png"
  alt="ThisWay Bread"
  width={128}  // 실제 렌더링 크기에 맞춰 지정
  height={32}
  className="h-8 w-auto"
/>

        {/* 오른쪽: 기획 */}
        <span className="absolute right-4 text-xs">기획: 송치호</span>
      </header>

      {/* 본문 */}
      <main className="w-full max-w-md p-4 flex-1">{children}</main>

      {/* 푸터 */}
      <footer className="w-full bg-[#f5c16c] p-2 text-center text-xs text-gray-700">
        © 2025 이런식빵. All Rights Reserved.
        <span className="mx-1">·</span>
        <Link href="/privacy" className="underline">개인정보처리방침</Link>
      </footer>
    </div>
  );
}
