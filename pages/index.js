// pages/index.js
import { useEffect, useState, useMemo, useCallback } from "react";
import { useRouter } from "next/router";
import Layout from "../components/Layout";
import { getStoreInfo } from "../services/guestApi";

export default function Home() {
  const router = useRouter();
  const [status, setStatus] = useState("");       // OPEN|DELAYED|UNAVAILABLE|NOT_READY|""
  const [statusMsg, setStatusMsg] = useState("");
  const [loading, setLoading] = useState(true);

  const loadStatus = useCallback(async () => {
    const info = await getStoreInfo(); // 항상 {status, message}
    setStatus(String(info.status).toUpperCase());
    setStatusMsg(info.message);
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        await loadStatus();
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    const t = setInterval(() => {
      loadStatus().catch(() => {});
    }, 10000);
    return () => {
      mounted = false;
      clearInterval(t);
    };
  }, [loadStatus]);

  const displayLabel = useMemo(() => {
    switch (status) {
      case "NOT_READY": return "오픈 전";
      case "OPEN": return "영업중";
      case "DELAYED": return "주문 지연중";
      case "UNAVAILABLE": return "주문 불가";
      default: return "상태 확인 중…";
    }
  }, [status]);

  const defaultMsgByStatus = {
    OPEN: "현재 주문이 가능해요.",
    DELAYED: "현재 주문량이 많아 주문이 지연되고 있어요.",
    UNAVAILABLE: "현재 주문폭주로 주문이 불가능해요.",
    NOT_READY: "매진되었거나 아직 오픈 전이에요.",
  };
  const displayMessage = (statusMsg || defaultMsgByStatus[status] || "").trim();

  const badgeBgClass = useMemo(() => {
    switch (status) {
      case "OPEN": return "bg-green-200";
      case "DELAYED": return "bg-yellow-200";
      case "UNAVAILABLE": return "bg-red-200";
      case "NOT_READY": return "bg-gray-200";
      default: return "bg-gray-200";
    }
  }, [status]);

  const messageColorClass = useMemo(() => {
    switch (status) {
      case "OPEN": return "text-green-600";
      case "DELAYED": return "text-yellow-600";
      case "UNAVAILABLE": return "text-red-600";
      case "NOT_READY": return "text-gray-600";
      default: return "text-gray-700";
    }
  }, [status]);

  const orderDisabled = loading || !status || status === "NOT_READY" || status === "UNAVAILABLE";

  const REFUND_POPUP = [
    "📢주문 전 가게 환불 규정을 꼭 확인해주세요!📢",
    "- 조리 전: 전액 환불",
    "- 조리 시작 후: 환불 불가",
    "- 기타 표준 소비자보호법에 적용되는 조건에 부합시: 환불 가능",
    "",
    "📢배달 주문 시 쓰레기는 쓰레기통에 잘 처리해주세요📢",
  ].join("\n");

  const handleOrderClick = async () => {
    try {
      const info = await getStoreInfo();
      const s = String(info.status).toUpperCase();
      setStatus(s);
      setStatusMsg(info.message);
      if (!s || s === "NOT_READY") return alert("오픈 전이에요. 잠시 후 다시 시도해 주세요.");
      if (s === "UNAVAILABLE") return alert("지금은 주문이 불가능해요. 잠시 후 다시 시도해 주세요.");
      alert(REFUND_POPUP);
      router.push("/order");
    } catch {
      alert("상태를 확인할 수 없어요. 잠시 후 다시 시도해 주세요.");
    }
  };

  return (
    <Layout>
      <main className="flex flex-col gap-4 mt-8 w-4/5 mx-auto">
        <div className="mx-auto text-sm text-center">
          <span
            className={`rounded-full px-3 py-1 ${badgeBgClass} text-neutral-900 font-bold shadow`}
          >
            {loading ? "상태 확인 중…" : displayLabel}
          </span>
          <p
            className={`mt-1 text-[13px] whitespace-pre-line ${
              loading ? "text-gray-700" : messageColorClass
            }`}
          >
            {loading ? "잠시만 기다려주세요…" : displayMessage}
          </p>
        </div>

        <button
          onClick={handleOrderClick}
          disabled={orderDisabled}
          className={`w-full font-bold py-4 rounded-xl shadow text-lg ${
            orderDisabled
              ? "bg-gray-300 text-gray-600 cursor-not-allowed"
              : "bg-yellow-400 text-black"
          }`}
          title={orderDisabled ? "현재 주문이 불가능합니다" : "배달 주문하기"}
        >
          🚴 배달 주문하기
        </button>

        <button
          onClick={() => router.push("/status-lookup")}
          className="w-full bg-green-500 font-bold py-4 rounded-xl shadow text-lg"
        >
          내 주문내역 조회
        </button>

{/* --- 현장구매 특전: 공지 카드 --- */}
{/* --- 현장구매 특전: 공지 카드 (수정판) --- */}
{/* --- 현장구매 특전: 공지 카드 (수정판) --- */}
<section
  aria-label="현장구매 특전 공지"
  className="relative overflow-hidden mt-4 rounded-2xl p-5
             bg-gradient-to-br from-purple-100 via-violet-100 to-fuchsia-100
             shadow-lg shadow-purple-300/40 border border-white/60"
>
  {/* 데코: 은은한 반짝이 */}
  <div className="pointer-events-none absolute inset-0 opacity-50">
    <div className="absolute -top-6 -left-6 h-24 w-24 rounded-full blur-2xl bg-purple-200/60" />
    <div className="absolute -bottom-8 -right-8 h-28 w-28 rounded-full blur-3xl bg-fuchsia-200/60" />
  </div>

  <div className="relative text-center">
    {/* 상단 배지 */}
    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full
                    bg-white/80 backdrop-blur border border-purple-200 shadow-sm">
      <span className="text-[21px] font-extrabold text-purple-700">✨ 현장구매 특전 ✨</span>
    </div>

    {/* 섹션 1: 뽑기이벤트 */}
    <h3 className="mt-3 text-xl font-bold text-purple-900">
      매장에서만 만나는 <span className="underline decoration-purple-300">뽑기이벤트</span> 🧚‍♀️
    </h3>
    <p className="mt-2 text-[13px] leading-5 text-purple-800">
      한정 티셔츠, 식빵이 타투 스티커 등<br /> 여러가지 <span className="font-semibold">특별상품</span>을
      <br className="sm:hidden" /> 노리고 싶다면!
    </p>

    {/* 섹션 2: 마늘빵 */}
    <h3 className="mt-4 text-xl font-bold text-purple-900">
      매장에서만 만나는 <span className="underline decoration-purple-300">???</span> 🧚‍♀️
    </h3>
    <p className="mt-2 text-[13px] leading-5 text-purple-800">
      기분좋은 <span className="font-semibold">???</span>을
      <br className="sm:hidden" /> 느끼고 싶다면!
    </p>

    {/* 혜택 배지들 */}
    <ul className="mt-4 flex flex-wrap items-center justify-center gap-2">
      <li className="text-[11px] px-2.5 py-1 rounded-full bg-white/80 border border-purple-200 text-purple-700 font-semibold shadow-sm">
        🎁 현장 구매 시 뽑기권 최대 3장
      </li>
      <li className="text-[11px] px-2.5 py-1 rounded-full bg-white/80 border border-purple-200 text-purple-700 font-semibold shadow-sm">
        🎁 당일 구운 ???(당일 한정 수량)
      </li>
      <li className="text-[11px] px-2.5 py-1 rounded-full bg-white/80 border border-purple-200 text-purple-700 font-semibold shadow-sm">
        🎁 부스 체험 스탬프 적립
      </li>
    </ul>

    {/* 안내 문구 */}
    <p className="mt-3 text-[12px] text-purple-700/80">
      * 수량한정 혜택은 매장 상황에 따라 변동될 수 있어요.
    </p>
  </div>
</section>

      </main>
    </Layout>
  );
}
