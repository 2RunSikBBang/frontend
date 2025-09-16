// pages/status.js
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import Layout from "../components/Layout";
import { getOrdersByPhone } from "../services/guestApi";

// 사용자에게 노출할 상태 라벨/색상 (진행중만 사용)
const ORDER_STATUS_LABELS = {
  PENDING: "주문을 확인하고 있습니다",
  PREPARING: "조리중입니다 🍞",
  DELIVERING: "배달중입니다 🛵",
};
const ORDER_STATUS_COLOR = {
  PENDING: "text-black",
  PREPARING: "text-blue-600",
  DELIVERING: "text-yellow-600",
};

// 진행중만 표시
const ACTIVE_SET = new Set(["PENDING", "PREPARING", "DELIVERING"]);

// 유틸
function fmtPhone(v) {
  const d = String(v || "").replace(/\D/g, "");
  if (d.length === 11 && d.startsWith("010")) return `010-${d.slice(3, 7)}-${d.slice(7)}`;
  return v || "";
}
function fmtTime(iso) {
  try {
    const d = new Date(iso);
    if (isNaN(d)) return "-";
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    let hh = d.getHours();
    const ap = hh < 12 ? "오전" : "오후";
    hh = hh % 12 || 12;
    const mi = String(d.getMinutes()).padStart(2, "0");
    return `${mm}/${dd} ${ap} ${hh}:${mi}`;
  } catch {
    return "-";
  }
}

export default function StatusPage() {
  const router = useRouter();
  const queryPhone = typeof router.query.phone === "string" ? router.query.phone : "";

  const [ordersAll, setOrdersAll] = useState([]); // 전체(최신순)
  const [loading, setLoading] = useState(false);

  const fetchAll = useCallback(async () => {
    if (!queryPhone) return;
    try {
      setLoading(true);
      const list = await getOrdersByPhone(queryPhone);
      setOrdersAll(Array.isArray(list) ? list : []);
    } catch {
      setOrdersAll([]);
    } finally {
      setLoading(false);
    }
  }, [queryPhone]);

  useEffect(() => {
    if (queryPhone) fetchAll();
  }, [queryPhone, fetchAll]);

  // 진행중만 추리기
  const activeOrders = ordersAll.filter((o) => ACTIVE_SET.has(o.status));

  // 로딩
  if (loading) {
    return (
      <Layout>
        <div className="text-center py-12 text-sm text-gray-500">불러오는 중…</div>
      </Layout>
    );
  }

  // 진행중 주문이 하나도 없으면 안내
  if (!queryPhone || activeOrders.length === 0) {
    return (
      <Layout>
        <h1 className="text-xl font-bold text-center my-4">주문 현황</h1>
        <div className="bg-white p-6 rounded-xl shadow text-center">
          <p className="font-bold mb-2">진행 중인 주문이 없습니다.</p>
          <p className="text-sm text-gray-600 mb-4">
            최근에 완료되었거나 취소된 주문은 개인정보 보호를 위해 표시하지 않습니다.
          </p>
          <div className="space-y-2">
            <button
              className="w-full bg-yellow-400 text-black font-bold py-3 rounded-xl"
              onClick={() => router.replace("/status-lookup")}
            >
              다른 번호로 조회하기
            </button>
            <Link href="/">
              <button className="w-full bg-gray-300 text-black font-bold py-3 rounded-xl">
                메인으로
              </button>
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  // 공통 표시용(가장 최근 진행중 주문)
  const base = activeOrders[0];
  const baseCustomer = base.customer || {};

  return (
    <Layout>
      <h1 className="text-xl font-bold text-center my-4">주문 현황</h1>

      {/* 주문자 (진행중 주문이 있을 때만 노출) */}
      <div className="bg-white p-4 rounded-xl shadow mb-4">
        <h2 className="font-bold mb-2">주문자</h2>
        <p>성명: {baseCustomer.name || "—"}</p>
        <p>연락처: {fmtPhone(baseCustomer.phone || queryPhone)}</p>
        <p>주소: {baseCustomer.address || "—"}</p>
      </div>

      {/* 진행중 주문 목록 */}
      <div className="space-y-3 mb-4">
        {activeOrders.map((o) => {
          const statusText = ORDER_STATUS_LABELS[o.status] ?? o.status;
          const statusClass = ORDER_STATUS_COLOR[o.status] ?? "text-black";
          return (
            <div key={o.orderId ?? o.orderDateMs} className="bg-white rounded-xl shadow p-4">
              <div className="flex justify-between mb-2">
                <div className="text-sm text-gray-500">{fmtTime(o.orderDate)}</div>
              </div>

              <div className="text-sm mb-2">
                <span className={`${statusClass} font-bold`}>{statusText}</span>
                {" "}
                <span className="text-gray-600 ml-1">
                  {o.totalPrice ? `· 총 ${o.totalPrice.toLocaleString("ko-KR")}원` : ""}
                </span>
              </div>

              <div className="text-sm">
                {o.items?.length ? (
                  <ul className="list-disc pl-5">
                    {o.items.map((it, i) => (
                      <li key={i}>
                        {it.name} x {it.quantity}개
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>주문내역이 없습니다.</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 액션 */}
      <div className="space-y-2">
        <button className="w-full bg-yellow-400 text-black font-bold py-3 rounded-xl" onClick={fetchAll}>
          새로고침
        </button>
        <Link href="/">
          <button className="w-full bg-gray-300 text-black font-bold py-3 rounded-xl">메인으로</button>
        </Link>
      </div>
    </Layout>
  );
}
