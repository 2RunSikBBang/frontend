// 서버 환경변수 ADMIN_CODE 사용 (NEXT_PUBLIC 아님)
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  const { password } = JSON.parse(req.body || "{}");
  const ok = password && password === process.env.ADMIN_CODE;
  if (!ok) return res.status(401).json({ ok: false });

  // 24시간 만료 HttpOnly 쿠키 발급
  res.setHeader("Set-Cookie", `admin_token=1; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400; Secure`);
  return res.json({ ok: true });
}
