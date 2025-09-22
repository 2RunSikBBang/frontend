
// next.config.js (ESM 버전)
// 배포 환경에서 BACKEND_API_BASE는 Vercel 환경변수로 설정하세요.
const BACKEND = process.env.BACKEND_API_BASE;

// ⚠️ 기본 CSP (너무 빡세지 않게 스타터 수준으로)
//   - 만약 외부 이미지/CDN을 쓴다면 img-src에 그 도메인을 추가하세요.
//   - 백엔드는 /api 프록시를 쓰므로 connect-src 'self' 만으로 충분.
const CSP = `
default-src 'self';
script-src 'self' 'unsafe-inline';
style-src 'self' 'unsafe-inline';
img-src 'self' data: blob:;
font-src 'self' data:;
connect-src 'self';
frame-ancestors 'none';
base-uri 'self';
form-action 'self';
`.replace(/\n/g, ' ');

// 공통 보안 헤더 (모든 경로)
const SECURITY_HEADERS = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "no-referrer" },
  { key: "Permissions-Policy", value: "geolocation=(), microphone=(), camera=()" },
];

// 민감 페이지 헤더 (캐시 금지 + 검색 인덱스 금지)
const SENSITIVE_HEADERS = [
  ...SECURITY_HEADERS,
  { key: "Cache-Control", value: "no-store, max-age=0" },
  { key: "Pragma", value: "no-cache" },
  { key: "X-Robots-Tag", value: "noindex, nofollow" },
];

const nextConfig = {
  async headers() {
    return [
      // 상태/결제/관리자 화면: 캐시 금지 + noindex + CSP
      {
        source: "/(status|status-lookup|payment|admin)(.*)",
        headers: [
          ...SENSITIVE_HEADERS,
          { key: "Content-Security-Policy", value: CSP },
        ],
      },
      // 나머지 모든 경로: 공통 보안 헤더만
      {
        source: "/:path*",
        headers: SECURITY_HEADERS,
      },
    ];
  },

  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${BACKEND}/:path*`,
      },
    ];
  },
};

export default nextConfig;
