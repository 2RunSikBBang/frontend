export default function AdminLayout({ children }) {
  return (

    <div className="min-h-screen bg-[#f9f1db] text-neutral-900 antialiased flex flex-col items-center">
      {/* 헤더 */}
      <header className="w-full bg-[#f5c16c] p-4 text-center font-bold text-lg flex items-center justify-center relative">
        <img src="/logo.png" alt="logo" className="w-12 h-10 mr-2" />
        이런식빵
        <span className="ml-2 text-sm text-red-600">관리자용</span>
        <span className="absolute right-4 text-xs">개발: 윤준석, 김유미</span>
      </header>

      {/* 본문 */}
      <main className="w-full max-w-md p-4 flex-1">{children}</main>

      {/* 푸터 */}
      <footer className="w-full bg-[#f5c16c] p-2 text-center text-xs text-gray-700">
        © 2025 이런식빵. All Rights Reserved.
      </footer>
    </div>
  );
}