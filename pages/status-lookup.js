// pages/status-lookup.js
import { useState } from "react";
import { useRouter } from "next/router";
import Layout from "../components/Layout";
import { isValidPhone, formatPhoneKR } from "../utils/validators";

export default function StatusLookupPage() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");

  const onChange = (e) => {
    setPhone(formatPhoneKR(e.target.value));
    if (error) setError("");
  };

  const onSubmit = (e) => {
    e.preventDefault();
    if (!isValidPhone(phone)) {
      setError("전화번호는 010-1234-1234 형식이어야 해요.");
      return;
    }
    const cleaned = phone.replace(/\D/g, "");
    router.push(`/status?phone=${encodeURIComponent(cleaned)}`);
  };

  return (
    <Layout>
      <h1 className="text-xl font-bold text-center my-4">주문 내역 조회</h1>
      <form onSubmit={onSubmit} className="bg-white p-6 rounded-xl shadow">
        <label className="block font-bold mb-2">휴대폰 번호</label>
        <input
          type="tel"
          inputMode="numeric"
          placeholder="010-1234-1234"
          value={phone}
          onChange={onChange}
          maxLength={13}
          className="w-full border rounded p-3 mb-2"
          autoComplete="tel"
        />
        {error && <p className="text-sm text-red-600 mb-2">{error}</p>}
        <button type="submit" className="w-full bg-yellow-400 text-black font-bold py-3 rounded-xl">
          주문 조회하기
        </button>
        <button
          type="button"
          onClick={() => router.push("/")}
          className="w-full bg-gray-300 text-black font-bold py-3 rounded-xl mt-2"
        >
          메인화면으로
        </button>
      </form>
    </Layout>
  );
}
