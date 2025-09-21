// pages/admin/index.js
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import AdminLayout from "../../components/AdminLayout";
import { operatorLogin } from "../../services/operatorApi";
import { getAuthToken } from "../../lib/axios";

export default function AdminLoginPage() {
  const router = useRouter();
  const [storeId, setStoreId] = useState("");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const t = getAuthToken();
    if (t) router.replace("/admin/orders");
  }, [router]);

  async function submit(e) {
    e.preventDefault();
    setErr("");

    if (!storeId) return setErr("스토어 ID를 입력해주세요.");
    if (!pw) return setErr("비밀번호를 입력해주세요.");

    try {
      setLoading(true);
      await operatorLogin({ storeId: Number(storeId), password: pw });
      router.replace("/admin/orders");
    } catch (e) {
      setErr(e?.message || "로그인에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AdminLayout>
      <form onSubmit={submit} className="space-y-4">
        <h2 className="text-center text-2xl font-extrabold">관리자 로그인</h2>

        <input
          type="text"
          placeholder="스토어 ID"
          value={storeId}
          onChange={(e) => setStoreId(e.target.value)}
          className="w-full rounded-2xl bg-white px-4 py-3 border"
          disabled={loading}
        />

        <input
          type="password"
          placeholder="비밀번호"
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          className="w-full rounded-2xl bg-white px-4 py-3 border"
          disabled={loading}
        />

        {err && <p className="text-sm text-red-600">{err}</p>}

        <button
          type="submit"
          className="w-full rounded-2xl bg-[#79A861] py-3 text-lg font-bold disabled:opacity-50"
          disabled={loading}
        >
          {loading ? "접속 중…" : "접속"}
        </button>
      </form>
    </AdminLayout>
  );
}
