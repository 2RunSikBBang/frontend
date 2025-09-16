// next.config.mjs
const BACKEND = process.env.BACKEND_API_BASE; // 예: "http://서버주소:8080" (Vercel 환경변수)

const nextConfig = {
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
