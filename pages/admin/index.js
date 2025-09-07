import { useState } from "react";
import { useRouter } from "next/router";
import AdminLayout from "../../components/AdminLayout";

export default function AdminLoginPage() {
  const router = useRouter();
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");

  async function submit(e) {
    e.preventDefault();
    setErr("");
    if (!pw) return setErr("비밀번호를 입력해주세요.");

    try {
      const r = await fetch("/api/admin/login", {
        method: "POST",
        body: JSON.stringify({ password: pw }),
      });
      if (!r.ok) throw new Error();
      // 쿠키가 발급되면 /admin/orders 접근 가능
      router.replace("/admin/orders");
    } catch {
      setErr("비밀번호가 올바르지 않습니다.");
    }
  }

  return (
    <AdminLayout>
      <form onSubmit={submit} className="space-y-6">
        <h2 className="text-center text-2xl font-extrabold">관리자 암호 입력</h2>
        <input
          type="password"
          placeholder="******"
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          className="w-full rounded-2xl bg-white px-4 py-3 border"
        />
        {err && <p className="text-sm text-red-600">{err}</p>}
        <button
          type="submit"
          className="w-full rounded-2xl bg-[#79A861] py-3 text-lg font-bold"
        >
          접속
        </button>
      </form>
    </AdminLayout>
  );
}
