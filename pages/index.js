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
      case "NOT_READY":
        return "오픈 전";
      case "OPEN":
        return "영업중";
      case "DELAYED":
        return "주문 지연중";
      case "UNAVAILABLE":
        return "주문 불가";
      default:
        return "상태 확인 중…";
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
      case "OPEN":
        return "bg-green-200";
      case "DELAYED":
        return "bg-yellow-200";
      case "UNAVAILABLE":
        return "bg-red-200";
      case "NOT_READY":
        return "bg-gray-200";
      default:
        return "bg-gray-200";
    }
  }, [status]);

  const messageColorClass = useMemo(() => {
    switch (status) {
      case "OPEN":
        return "text-green-600";
      case "DELAYED":
        return "text-yellow-600";
      case "UNAVAILABLE":
        return "text-red-600";
      case "NOT_READY":
        return "text-gray-600";
      default:
        return "text-gray-700";
    }
  }, [status]);

  const orderDisabled = loading || !status || status === "NOT_READY" || status === "UNAVAILABLE";

  const REFUND_POPUP = ["[주문 전 가게 환불 규정을 꼭 확인해주세요!]", "- 조리 전: 전액 환불", "- 조리 시작 후: 환불 불가", "- 기타 표준 소비자보호법에 적용되는 조건에 부합시: 환불 가능"].join("\n");

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
          <span className={`rounded-full px-3 py-1 ${badgeBgClass} text-neutral-900 font-bold shadow`}>
            {loading ? "상태 확인 중…" : displayLabel}
          </span>
          <p className={`mt-1 text-[13px] whitespace-pre-line ${loading ? "text-gray-700" : messageColorClass}`}>
            {loading ? "잠시만 기다려주세요…" : displayMessage}
          </p>
        </div>

        <button
          onClick={handleOrderClick}
          disabled={orderDisabled}
          className={`w-full font-bold py-4 rounded-xl shadow text-lg
            ${orderDisabled ? "bg-gray-300 text-gray-600 cursor-not-allowed" : "bg-yellow-400 text-black"}`}
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
      </main>
    </Layout>
  );
}
