// next.config.js
const BACKEND = process.env.BACKEND_API_BASE || "http://localhost:8080";

/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      // 브라우저는 /api/* 로만 호출, Next가 백엔드로 프록시
      { source: "/api/:path*", destination: `${BACKEND}/:path*` },
    ];
  },
};

module.exports = nextConfig;
