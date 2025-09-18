// pages/admin/orders.js
import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { useRouter } from "next/router";
import AdminLayout from "../../components/AdminLayout";
import {
  listStoreOrders,
  updateOrderStatus,
  operatorLogout,
  updateStoreStatus,
  getStoreInfoForOperator,
  getCurrentStoreId,
} from "../../services/operatorApi";
import { getAllStoreStatuses, getMenus, createGuestOrder } from "../../services/guestApi";

// 주문상태
const ORDER_STATUS_LABELS = {
  PENDING: "주문을 확인하고 있습니다.",
  PREPARING: "조리중입니다...",
  DELIVERING: "배송 중 이에요....",
  COMPLETED: "배송 완료",
  CANCELED: "미입금으로 취소 되었어요",
};
const ORDER_STATUS_TEXT_CLASS = {
  PENDING: "text-blue-600",
  PREPARING: "text-yellow-600",
  DELIVERING: "text-green-600",
  COMPLETED: "text-black",
  CANCELED: "text-red-600",
};
const ORDER_STATUS_OPTIONS = [
  { value: "PENDING", short: "주문확인중" },
  { value: "PREPARING", short: "조리중" },
  { value: "DELIVERING", short: "배달중" },
  { value: "COMPLETED", short: "배달완료" },
  { value: "CANCELED", short: "미입금으로취소" },
];

// 가게 상태 옵션
const STATUS_OPTIONS = [
  { value: "OPEN", label: "영업중(O)" },
  { value: "DELAYED", label: "주문지연중(O)" },
  { value: "UNAVAILABLE", label: "주문불가(-)" },
  { value: "NOT_READY", label: "오픈전(-)" },
];

function statusLabel(v) {
  if (!v) return "상태 불러오는 중…";
  const f = STATUS_OPTIONS.find((o) => o.value === v);
  return f ? f.label : "상태 미정";
}
function statusClasses(v) {
  switch (v) {
    case "OPEN": return "bg-green-200 hover:bg-green-300";
    case "DELAYED": return "bg-yellow-200 hover:bg-yellow-300";
    case "UNAVAILABLE": return "bg-red-200 hover:bg-red-300";
    case "NOT_READY": return "bg-gray-200 hover:bg-gray-300";
    default: return "bg-gray-100 hover:bg-gray-200";
  }
}
function fmtTime(iso) {
  try {
    const d = new Date(iso);
    if (isNaN(d)) return "-";
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    let hours = d.getHours();
    const minutes = String(d.getMinutes()).padStart(2, "0");
    const ampm = hours < 12 ? "오전" : "오후";
    hours = hours % 12;
    if (hours === 0) hours = 12;
    return `${month}/${day} ${ampm} ${hours}:${minutes}`;
  } catch { return "-"; }
}

export default function AdminOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [storeStatus, setStoreStatus] = useState(null);
  const [statusMsg, setStatusMsg] = useState("");

  const [openMenu, setOpenMenu] = useState(false);
  const menuRef = useRef(null);

  const [openOrderMenuId, setOpenOrderMenuId] = useState(null);
  const [savingOrderId, setSavingOrderId] = useState(null);

  const orderMenuContainerRefs = useRef({});
  const setOrderMenuContainerRef = useCallback((orderId, el) => {
    if (!orderId) return;
    orderMenuContainerRefs.current[orderId] = el || undefined;
  }, []);

  // 전화 추가주문 패널 상태
  const [addOpenFor, setAddOpenFor] = useState(null); // 해당 주문 id
  const [menus, setMenus] = useState([]);
  const [qty, setQty] = useState({}); // { [menuId]: number }
  const [addingBusy, setAddingBusy] = useState(false);

  const ensureMenus = useCallback(async () => {
    if (menus.length > 0) return;
    try {
      const m = await getMenus();
      setMenus(m);
      const init = {};
      m.forEach((x) => (init[x.id] = 0));
      setQty(init);
    } catch {
      alert("메뉴를 불러오지 못했습니다.");
    }
  }, [menus.length]);

  const changeQty = (id, delta) => {
    const m = menus.find((x) => x.id === id);
    const minQ = Number.isFinite(m?.minOrderQuantity) ? Number(m.minOrderQuantity) : 0;
    const maxQ = Number.isFinite(m?.maxOrderQuantity) ? Number(m.maxOrderQuantity) : Infinity;
    setQty((prev) => {
      const next = Math.min(maxQ, Math.max(minQ, (prev[id] || 0) + delta));
      return { ...prev, [id]: next };
    });
  };

  const selectedItems = useMemo(
    () =>
      menus
        .filter((m) => (qty[m.id] || 0) > 0)
        .map((m) => ({ id: m.id, name: m.name, price: m.price, quantity: qty[m.id] })),
    [menus, qty]
  );

  const totalAdd = useMemo(
    () => selectedItems.reduce((s, it) => s + it.price * it.quantity, 0),
    [selectedItems]
  );

  const openPhoneExtra = async (orderId) => {
    setAddOpenFor(orderId);
    await ensureMenus();
  };

  const submitPhoneExtra = async () => {
    if (!addOpenFor) return;
    const base = orders.find((o) => String(o.id) === String(addOpenFor));
    if (!base) return alert("기준 주문을 찾지 못했습니다.");
    if (selectedItems.length === 0) return alert("메뉴를 1개 이상 선택하세요.");
    try {
      setAddingBusy(true);
      await createGuestOrder({
        customer: {
          name: base.customer?.name || "",
          phone: base.customer?.phone || "",
          address: base.customer?.address || "",
        },
        items: selectedItems,
      });
      alert(`#${base.id} 전화 추가주문이 생성되었습니다.`);
      // 초기화
      const init = {};
      menus.forEach((x) => (init[x.id] = 0));
      setQty(init);
      setAddOpenFor(null);
      fetchOrders();
    } catch (e) {
      alert(e?.message || "전화 추가주문 생성 실패");
    } finally {
      setAddingBusy(false);
    }
  };

  const fetchOrders = useCallback(async () => {
    try {
      setErrorMsg("");
      setLoading(true);
      const rows = await listStoreOrders();
      setOrders(rows);
    } catch (e) {
      const msg = e?.message || "";
      if (msg.includes("401") || msg.includes("403")) {
        operatorLogout();
        if (router.pathname !== "/admin") router.replace("/admin");
        return;
      }
      setErrorMsg("주문 목록을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  const fetchStoreStatusOnce = useCallback(async () => {
    const list = await getAllStoreStatuses();
    const sid = getCurrentStoreId();
    const row = list.find((r) => String(r.storeId) === String(sid));
    return row ? row.status : null;
  }, []);

  const fetchStoreStatus = useCallback(async () => {
    try {
      const s = await fetchStoreStatusOnce();
      if (s) setStoreStatus(s);
    } catch (e) {
      console.warn("fetchStoreStatus failed", e);
    }
  }, [fetchStoreStatusOnce]);

  const fetchOperatorInfo = useCallback(async () => {
    try {
      const info = await getStoreInfoForOperator();
      setStatusMsg(info.statusMessage);
    } catch (e) {
      console.warn("getStoreInfoForOperator failed", e);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
    const h1 = setTimeout(fetchStoreStatus, 200);
    const h2 = setTimeout(fetchOperatorInfo, 250);
    const t = setInterval(fetchOrders, 5000);
    return () => {
      clearTimeout(h1);
      clearTimeout(h2);
      clearInterval(t);
    };
  }, [fetchOrders, fetchStoreStatus, fetchOperatorInfo]);

useEffect(() => {
  function onClickOutside(e) {
    // 상단 상태 드롭다운
    if (menuRef.current && !menuRef.current.contains(e.target)) setOpenMenu(false);

    // 주문 상태 변경 메뉴
    if (openOrderMenuId != null) {
      const container = orderMenuContainerRefs.current[openOrderMenuId];
      if (!container || !container.contains(e.target)) setOpenOrderMenuId(null);
    }

    // 전화 추가주문 패널: 현재 열린 주문(addOpenFor)의 패널만 체크
    if (addOpenFor != null) {
      const panel = document.getElementById(`phone-extra-panel-${addOpenFor}`);
      if (panel && !panel.contains(e.target)) {
        setAddOpenFor(null);
      }
    }
  }

  function onKey(e) {
    if (e.key === "Escape") {
      setOpenMenu(false);
      setOpenOrderMenuId(null);
      setAddOpenFor(null);
    }
  }

  document.addEventListener("click", onClickOutside);
  document.addEventListener("keydown", onKey);
  return () => {
    document.removeEventListener("click", onClickOutside);
    document.removeEventListener("keydown", onKey);
  };
}, [openOrderMenuId, addOpenFor]);

  const handleSelectOrderStatus = async (orderId, nextStatus) => {
    try {
      setSavingOrderId(orderId);
      await updateOrderStatus(orderId, nextStatus);
      setOpenOrderMenuId(null);
      fetchOrders();
    } catch (e) {
      alert(e?.message || "주문 상태 변경 실패");
    } finally {
      setSavingOrderId(null);
    }
  };

  const handleLogout = () => {
    operatorLogout();
    router.replace("/admin");
  };

  const wait = (ms) => new Promise((res) => setTimeout(res, ms));
  const changeStoreStatus = async (value) => {
    const prev = storeStatus;
    setStoreStatus(value);
    setOpenMenu(false);
    try {
      await updateStoreStatus({ status: value });
      for (let i = 0; i < 5; i++) {
        await wait(i === 0 ? 700 : 500);
        try {
          const s = await fetchStoreStatusOnce();
          if (s && s === value) {
            setStoreStatus(s);
            break;
          }
        } catch {}
      }
      fetchOperatorInfo();
    } catch (err) {
      setStoreStatus(prev);
      alert(err?.message || "가게 상태 변경 실패");
    }
  };

  return (
    <AdminLayout>
      {/* 헤더 / 툴바 */}
      <div className="mb-4">
        <h1 className="text-xl font-bold text-center mb-2">주문 관리</h1>

        <div className="flex justify-between items-center gap-2">
          <button
            onClick={handleLogout}
            className="rounded-xl bg-gray-300 px-3 py-2 text-sm font-bold hover:bg-gray-400"
          >
            로그아웃
          </button>

          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setOpenMenu((v) => !v)}
              className={`rounded-xl px-3 py-2 text-sm font-bold inline-flex items-center gap-2 ${statusClasses(storeStatus)}`}
            >
              {statusLabel(storeStatus)}
              <span className="inline-block translate-y-[1px]">▾</span>
            </button>

            {openMenu && (
              <div className="absolute left-1/2 -translate-x-1/2 mt-2 w-40 rounded-xl shadow bg-white ring-1 ring-black/5 z-20">
                {STATUS_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => changeStoreStatus(opt.value)}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-neutral-100 rounded-xl ${
                      storeStatus === opt.value ? "font-bold" : ""
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={fetchOrders}
            className="rounded-xl bg-[#f5c16c] px-3 py-2 text-sm font-bold hover:bg-[#e0aa45]"
          >
            새로고침
          </button>
        </div>

        {statusMsg && (
          <p className="mt-2 text-center text-xs text-gray-600 whitespace-pre-line">{statusMsg}</p>
        )}
      </div>

      {/* 주문 목록 */}
      {loading && <p className="text-sm text-gray-500">불러오는 중…</p>}
      {errorMsg && <p className="text-sm text-red-600">{errorMsg}</p>}
      {!loading && !errorMsg && orders.length === 0 && <p className="text-sm">주문이 없습니다.</p>}

      <div className="space-y-3">
        {orders.map((o) => {
          const orderId = o.id ?? "—";
          const isMenuOpen = openOrderMenuId === orderId;
          const isSaving = savingOrderId === orderId;

          return (
            <div key={orderId} className="bg-white rounded-xl shadow p-4">
              <div className="flex justify-between mb-2">
                <div className="font-bold">#{orderId}</div>
                <div className="text-sm text-gray-500">{fmtTime(o.orderDate)}</div>
              </div>

              <div className="text-sm">
                <div>이름: {o.customer.name || "-"}</div>
                <div>전화: {o.customer.phone || "-"}</div>
                <div>주소: {o.customer.address || "-"}</div>
              </div>

              <ul className="text-sm list-disc pl-5 my-2">
                {o.items.map((it, i2) => (
                  <li key={i2}>
                    {it.name} x {it.quantity}개
                  </li>
                ))}
              </ul>

              <div className="flex justify-between items-start mt-2 gap-3">
                {/* 왼쪽: 상태/결제 1줄 + 금액 1줄 */}
                <div className="text-sm flex-1">
                  <div>
                    상태:{" "}
                    <b className={ORDER_STATUS_TEXT_CLASS[o.status] || "text-gray-800"}>
                      {ORDER_STATUS_LABELS[o.status] || o.status}
                    </b>
                    {typeof o.paid !== "undefined" && (
                      <> / 결제: <b>{o.paid ? "확정" : "대기"}</b></>
                    )}
                  </div>

                  {typeof o.amount !== "undefined" && (
                    <div className="mt-1">
                      금액: <b>{Number(o.amount).toLocaleString("ko-KR")}원</b>
                    </div>
                  )}
                </div>

                {/* 오른쪽: 버튼 영역 (전화 추가주문 → 왼쪽, 상태변경 → 오른쪽) */}
                <div className="flex items-start gap-2">
                  {/* 전화 추가주문 버튼 */}
                <button
                  type="button"
                  className="bg-amber-200 px-3 py-1 rounded hover:bg-amber-300"
                  onClick={(e) => {
                    e.stopPropagation();            // ← 문서 밖 클릭 핸들러로 전파 차단
                    openPhoneExtra(orderId);
                  }}
                >
                    추가주문
                  </button>

                  {/* 상태 변경 버튼 */}
                  <div className="relative" ref={(el) => setOrderMenuContainerRef(orderId, el)}>
                    <button
                      className="bg-yellow-200 px-3 py-1 rounded hover:bg-yellow-300"
                      onClick={() =>
                        setOpenOrderMenuId((cur) => (cur === orderId ? null : orderId))
                      }
                      disabled={isSaving}
                    >
                      상태변경
                    </button>

                    {isMenuOpen && (
                      <div className="absolute right-0 top-10 w-44 rounded-xl shadow bg-white ring-1 ring-black/5 z-30">
                        {ORDER_STATUS_OPTIONS.map((opt) => (
                          <button
                            key={opt.value}
                            type="button"
                            disabled={isSaving}
                            onClick={() => handleSelectOrderStatus(orderId, opt.value)}
                            className={`w-full text-left px-3 py-2 text-sm hover:bg-neutral-100 rounded-xl ${
                              o.status === opt.value ? "font-bold" : ""
                            } ${isSaving ? "opacity-60 cursor-not-allowed" : ""}`}
                          >
                            {opt.short}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* 전화 추가주문 입력 패널 */}
              {String(addOpenFor) === String(orderId) && (
                <div id={`phone-extra-panel-${orderId}`} className="mt-3 border-t pt-3">
                  <p className="text-sm font-bold mb-2">추가 품목 선택</p>
                  {menus.length === 0 && <p className="text-sm text-gray-500">메뉴를 불러오는 중…</p>}
                  {menus.map((m) => {
                    const q = qty[m.id] || 0;
                    const minQ = Number.isFinite(m.minOrderQuantity) ? m.minOrderQuantity : 0;
                    const maxQ = Number.isFinite(m.maxOrderQuantity) ? m.maxOrderQuantity : Infinity;
                    const atMin = q <= minQ;
                    const atMax = q >= maxQ;
                    return (
                      <div key={m.id} className="flex justify-between items-center mb-2">
                        <div className="flex flex-col">
                          <span>{m.name}</span>
                          <span className="text-xs text-gray-500">
                            {m.price.toLocaleString("ko-KR")}원
                          </span>
                          {Number.isFinite(maxQ) && (
                            <span className="text-[11px] text-gray-500">최대 {maxQ}개</span>
                          )}
                          {minQ > 0 && (
                            <span className="text-[11px] text-gray-500">최소 {minQ}개</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            className={`px-2 py-1 rounded ${
                              atMin
                                ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                                : "bg-red-300"
                            }`}
                            onClick={() => changeQty(m.id, -1)}
                            disabled={atMin}
                          >
                            -
                          </button>
                          <span>{q}</span>
                          <button
                            className={`px-2 py-1 rounded ${
                              atMax
                                ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                                : "bg-blue-300"
                            }`}
                            onClick={() => changeQty(m.id, +1)}
                            disabled={atMax}
                          >
                            +
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  <p className="font-bold mt-2">
                    추가 주문금액: {totalAdd.toLocaleString("ko-KR")}원
                  </p>
                  <div className="flex gap-2 mt-2">
                    <button
                      className="flex-1 bg-green-400 text-black font-bold py-2 rounded-xl disabled:opacity-60"
                      onClick={submitPhoneExtra}
                      disabled={addingBusy || selectedItems.length === 0}
                    >
                      {addingBusy ? "처리 중…" : "추가주문 생성"}
                    </button>
                    <button
                      className="flex-1 bg-gray-300 text-black font-bold py-2 rounded-xl"
                      onClick={() => setAddOpenFor(null)}
                      disabled={addingBusy}
                    >
                      닫기
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </AdminLayout>
  );
}

