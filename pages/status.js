// pages/status.js
import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import Layout from "../components/Layout";
import { getOrdersByPhone, getPublicStoreDetail } from "../services/guestApi";

// 진행중 상태만 노출
const ORDER_STATUS_LABELS = {
  PENDING: "주문을 확인하고 있습니다",
  PREPARING: "조리중입니다 🍞",
  DELIVERING: "배달중입니다 🛵",
};
const ORDER_STATUS_COLOR = {
  PENDING: "text-blue-600",
  PREPARING: "text-yellow-600",
  DELIVERING: "text-green-600",
};
const ACTIVE_SET = new Set(["PENDING", "PREPARING", "DELIVERING"]);

// ───────────── 유틸 ─────────────
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
function digits(s) {
  return String(s || "").replace(/\D/g, "");
}
function dateKey(iso) {
  const d = new Date(iso);
  if (isNaN(d)) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const da = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${da}`; // 로컬 타임존 기준 날짜 키
}
/** 주소에서 건물명 추출: 첫 공백 전 토큰을 건물로 간주 */
function pickBuilding(address) {
  const s = String(address || "").trim();
  if (!s) return "";
  return s.split(/\s+/)[0];
}

export default function StatusPage() {
  const router = useRouter();
  const queryPhone = typeof router.query.phone === "string" ? router.query.phone : "";

  const [ordersAll, setOrdersAll] = useState([]);
  const [loading, setLoading] = useState(false);

  // 가게 연락처/계좌
  const [callNumber, setCallNumber] = useState("");
  const [bankLine, setBankLine] = useState("");
  const [copied, setCopied] = useState(false);

  function extractAccountDigits(line) {
    return String(line || "").replace(/\D/g, "");
  }
  async function copyAccount() {
    const digitsOnly = extractAccountDigits(bankLine) || bankLine;
    try {
      await navigator.clipboard.writeText(digitsOnly);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      const el = document.createElement("textarea");
      el.value = digitsOnly;
      el.setAttribute("readonly", "");
      el.style.position = "absolute";
      el.style.left = "-9999px";
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  }

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

  useEffect(() => {
    getPublicStoreDetail()
      .then((d) => {
        setCallNumber((d.cancelPhoneNumber || "").trim());
        setBankLine((d.bankAccount || "").trim());
      })
      .catch(() => {
        setCallNumber("");
        setBankLine("");
      });
  }, []);

  // 진행중만 필터
  const activeOrders = useMemo(
    () => ordersAll.filter((o) => ACTIVE_SET.has(o.status)),
    [ordersAll]
  );

  // 기준 주문(가장 최근 진행중)
  const base = activeOrders[0] || null;
  const baseCustomer = base?.customer || {};

  // 추가 주문(기준 외 진행중) — 같은 이름+전화+날짜(로컬)+건물만
  const extraActives = useMemo(() => {
    if (!base) return [];
    const baseName = (baseCustomer.name || "").trim();
    const basePhone = digits(baseCustomer.phone || queryPhone);
    const baseDate = dateKey(base.orderDate);
    const baseBuilding = pickBuilding(baseCustomer.address);

    return activeOrders.filter((o) => {
      if (o === base) return false;
      const oc = o.customer || {};
      const oName = (oc.name || "").trim();
      const oPhone = digits(oc.phone);
      const oDate = dateKey(o.orderDate);
      const oBuilding = pickBuilding(oc.address);
      return (
        oName === baseName &&
        oPhone === basePhone &&
        oDate === baseDate &&
        oBuilding === baseBuilding
      );
    });
  }, [activeOrders, base, baseCustomer?.name, baseCustomer?.phone, baseCustomer?.address, queryPhone]);

  // 로딩
  if (loading) {
    return (
      <Layout>
        <div className="text-center py-12 text-sm text-gray-500">불러오는 중…</div>
      </Layout>
    );
  }

  // 진행중이 없으면 안내
  if (!queryPhone || !base) {
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

  // 주문번호 표시용
  const baseOrderId = base.orderId ?? base.id ?? null;

  return (
    <Layout>
      <h1 className="text-xl font-bold text-center my-4">주문 현황</h1>

      {/* 주문자 */}
      <div className="bg-white p-4 rounded-xl shadow mb-4">
        <h2 className="font-bold mb-2">주문자</h2>
        <p>성명: {baseCustomer.name || "—"}</p>
        <p>연락처: {fmtPhone(baseCustomer.phone || queryPhone)}</p>
        <p>주소: {baseCustomer.address || "—"}</p>
      </div>

      {/* 기준 주문 내역 (+ 주문번호 표시) */}
      <div className="bg-white p-4 rounded-xl shadow mb-4">
        <h2 className="font-bold mb-3">주문 내역</h2>
        {baseOrderId && (
          <p className="text-xs text-gray-500">주문번호: <b>#{baseOrderId}</b></p>
        )}
        {base.orderDate && (
              <p className="text-xs text-gray-500 mb-1">주문시간: {fmtTime(base.orderDate)}</p>
            )}
        {Array.isArray(base.items) && base.items.length > 0 ? (
          <>
            <ul>
              {base.items.map((it, i) => (
                <li key={i}>
                  {it.name} x {it.quantity}개
                </li>
              ))}
            </ul>
            {typeof base.totalPrice === "number" && base.totalPrice > 0 && (
              <p className="font-bold mt-1">
                총 금액: {base.totalPrice.toLocaleString("ko-KR")}원
              </p>
            )}
          </>
        ) : (
          <p>주문 내역이 없습니다.</p>
        )}
      </div>

      {/* 추가 주문 내역 (기준과 묶임) */}
      {extraActives.length > 0 && (
        <div className="bg-white p-4 rounded-xl shadow mb-4">
          <h2 className="font-bold mb-3">추가 주문 내역</h2>
          <ul className="space-y-3">
            {extraActives.map((o, idx) => (
              <li key={`${o.orderId ?? o.id ?? idx}`} className="rounded-lg">
                <div className="text-xs text-gray-500">
                  주문번호: <b>#{o.orderId ?? o.id ?? "—"}</b>
                </div>
                {o.orderDate && (
                  <p className="text-xs text-gray-500">주문시간: {fmtTime(o.orderDate)}</p>
                )}
                <div className="mt-1 mb-1">
                  {Array.isArray(o.items) && o.items.map((it, i2) => (
                    <div key={i2}>
                      {it.name} x {it.quantity}개
                    </div>
                  ))}
                </div>
                {typeof o.totalPrice === "number" && o.totalPrice > 0 && (
                  <div className="font-bold">
                    추가 금액: {o.totalPrice.toLocaleString("ko-KR")}원
                  </div>
                )}
              </li>
            ))}
          </ul>
          <p className="text-xs text-gray-500 mt-2">
            추가 주문은 기준 주문과 함께 조리·배달됩니다.
          </p>
        </div>
      )}

      {/* 현재 상태 + 안내문 + 전화 + 계좌복사 */}
      <div className="bg-white p-6 rounded-xl shadow text-center mb-4">
        <h2 className="font-bold mb-2">현재 상태</h2>
        <p className={`${ORDER_STATUS_COLOR[base.status] ?? "text-black"} font-bold`}>
          {ORDER_STATUS_LABELS[base.status] ?? base.status}
        </p>

        <div className="mt-3 text-xs text-gray-600 whitespace-pre-line">
{`주문내역 확인 시, 아직 송금 전이라면 주문이 거절될 수 있어요.
주문 및 결제 후 취소는 전화로만 가능합니다.`}
        </div>

        {/* 가게 전화 */}
        <a
          href={`tel:${(callNumber || "01030332199").replace(/\D/g, "")}`}
          className="mt-3 w-full bg-yellow-400 text-black font-bold py-3 rounded-xl inline-block"
        >
          추가주문/취소요청/문의 ({callNumber || "010-3033-2199"})
        </a>

        {/* 결제 계좌 + 복사 버튼 */}
        {bankLine && (
          <div className="mt-3">
            <div className="flex items-center justify-center gap-2">
              <p className="text-sm font-bold text-gray-800 select-all">
                추가주문 시 결제: {bankLine}
              </p>
              <button
                onClick={copyAccount}
                className="bg-gray-200 hover:bg-gray-300 text-sm px-2 py-1 rounded active:scale-95"
              >
                복사
              </button>
            </div>
            {copied && (
              <p className="text-xs text-green-600 mt-1 text-center">
                계좌번호가 복사됐어요
              </p>
            )}
          </div>
        )}
      </div>

      {/* 액션 */}
      <div className="space-y-2">
        <button
          className="w-full bg-yellow-400 text-black font-bold py-3 rounded-xl"
          onClick={fetchAll}
        >
          새로고침
        </button>
        <Link href="/">
          <button className="w-full bg-gray-300 text-black font-bold py-3 rounded-xl">
            메인으로
          </button>
        </Link>
      </div>
    </Layout>
  );
}
