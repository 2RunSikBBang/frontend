export default function handler(req,res){
  res.setHeader("Set-Cookie", "admin_token=; Path=/; HttpOnly; Max-Age=0; SameSite=Lax; Secure");
  res.json({ ok:true });
}
