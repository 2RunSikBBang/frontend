import { NextResponse } from "next/server";

export function middleware(req) {
  const url = req.nextUrl;
  if (url.pathname.startsWith("/admin")) {
    const token = req.cookies.get("admin_token")?.value;
    if (!token && url.pathname !== "/admin") {
      url.pathname = "/admin"; // 로그인 페이지로
      return NextResponse.redirect(url);
    }
  }
  return NextResponse.next();
}
