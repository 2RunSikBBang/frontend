// services/guestApi.js
import api from "../lib/axios";

const STORE_ID = process.env.NEXT_PUBLIC_STORE_ID;

// 내부 표준 주문 형태로 정규화
function normalizeOrder(row) {
  const itemsRaw = Array.isArray(row?.orderItems) ? row.orderItems : (row?.items || []);
  const items = itemsRaw.map((it) => ({
    name: String(it.menuName ?? it.name ?? "메뉴"),
    quantity: Number(it.quantity || 0),
    price: Number(it.price || 0),
  }));

  return {
    id: row?.orderId ?? row?.id ?? null,
    orderDate: row?.orderDate ?? row?.createdAt ?? row?.created_at ?? null,
    status: String(row?.status || "PENDING").toUpperCase(),
    amount: Number(row?.totalPrice ?? row?.amount ?? 0),
    paid: typeof row?.paid === "boolean" ? row.paid : undefined,
    customer: {
      name: String(row?.customerName ?? row?.customer?.name ?? ""),
      phone: String(row?.phoneNumber ?? row?.customer?.phone ?? ""),
      address: String(row?.deliveryAddress ?? row?.customer?.address ?? ""),
    },
    items, // [{name, quantity, price}]
  };
}

/** 메뉴 목록 조회: GET /guest/stores/{storeId}/menus
 * 표준화: 숫자/불리언 보장, max가 없으면 Infinity
 */
export async function getMenus() {
  const { data } = await api.get(`/guest/stores/${STORE_ID}/menus`, {
    params: { _ts: Date.now() },
    headers: { "Cache-Control": "no-cache" },
  });
  if (data && data.success === false) throw new Error(data.message || "메뉴 조회 실패");
  const rows = Array.isArray(data?.data) ? data.data : [];
  return rows.map((m) => {
    const price = Number(m.price || 0);
    const minQ = Number.isFinite(m.minOrderQuantity) ? Number(m.minOrderQuantity) : 0;
    const rawMax = Number(m.maxOrderQuantity);
    const maxQ = Number.isFinite(rawMax) && rawMax > 0 ? rawMax : Infinity;
    return {
      id: m.id,
      name: String(m.name || ""),
      price,
      minOrderQuantity: Math.max(0, minQ),
      maxOrderQuantity: maxQ,
      isRepresentative: !!m.isRepresentative,
    };
  });
}

/** 모든 가게 상태: GET /guest/stores/status/all
 * 표준화: status 대문자, message 문자열
 */
export async function getAllStoreStatuses() {
  const { data } = await api.get(`/guest/stores/status/all`, {
    params: { _ts: Date.now() },
    headers: { "Cache-Control": "no-cache" },
  });
  if (data && data.success === false) throw new Error(data.message || "가게 상태 목록 조회 실패");
  const rows = Array.isArray(data?.data) ? data.data : [];
  return rows.map((r) => ({
    storeId: r.storeId,
    status: String(r.status || "NOT_READY").toUpperCase(),
    message: String(r.message || ""),
  }));
}

/** 내 스토어 상태 1건: { storeId, status, message } */
export async function getStoreInfo() {
  const list = await getAllStoreStatuses();
  const sid = String(STORE_ID ?? "");
  const found = list.find((r) => String(r.storeId) === sid);
  return (
    found ?? { storeId: sid || null, status: "NOT_READY", message: "매진되었거나 아직 오픈 전이에요." }
  );
}

/** 주문 내역 조회(전화번호) - 정규화 + 최신순 정렬 */
export async function getOrdersByPhone(phoneNumber) {
  const cleaned = String(phoneNumber || "").replace(/\D/g, "");
  const { data } = await api.get(`/guest/orders/${encodeURIComponent(cleaned)}`, {
    params: { _ts: Date.now() }, // 캐시 회피
    headers: { "Cache-Control": "no-cache" },
  });

  if (data?.success === false) throw new Error(data?.message || "주문 조회 실패");

  const rows = Array.isArray(data?.data) ? data.data : (data?.data ? [data.data] : []);
  const list = rows.map((r) => {
    const orderId = r.orderId ?? r.id ?? null;
    const status = String(r.status || "").toUpperCase();
    const when = r.orderDate ?? r.createdAt ?? r.created_at ?? null;
    const orderDateMs = when ? Date.parse(when) || 0 : 0;

    // 고객
    const customer = {
      name: r.customerName ?? r.customer?.name ?? "",
      phone: r.phoneNumber ?? r.customer?.phone ?? "",
      address: r.deliveryAddress ?? r.customer?.address ?? "",
    };

    // 아이템 정규화
    const rawItems = Array.isArray(r.orderItems) ? r.orderItems : (Array.isArray(r.items) ? r.items : []);
    const items = rawItems.map((it) => ({
      name: it.menuName ?? it.name ?? "메뉴",
      quantity: Number(it.quantity ?? 0),
      price: Number(it.price ?? 0),
    }));

    const totalPrice = Number(r.totalPrice ?? items.reduce((s, it) => s + it.price * it.quantity, 0));

    return { orderId, status, orderDate: when, orderDateMs, customer, items, totalPrice };
  });

  // 최신순(내림차순)
  list.sort((a, b) => (b.orderDateMs || 0) - (a.orderDateMs || 0));
  return list;
}

/** 주문 생성: POST /guest/stores/{storeId}/orders */
export async function createGuestOrder({ customer, items }) {
  const cleanedPhone = String(customer.phone || "").replace(/\D/g, "");
  if (!/^010\d{8}$/.test(cleanedPhone)) {
    throw new Error("전화번호 형식이 올바르지 않습니다. 예: 010-1234-1234");
  }
  const orderItems = items
    .map((it) => ({
      menuId: it.id,
      menuName: it.name,
      quantity: Number(it.quantity || 0),
      price: Number(it.price || 0),
    }))
    .filter((it) => it.menuId != null && it.quantity > 0 && it.price > 0);

  const body = {
    phoneNumber: cleanedPhone,
    customerName: String(customer.name || "").trim(),
    deliveryAddress: String(customer.address || "").trim(),
    orderItems,
  };

  const { data } = await api.post(`/guest/stores/${STORE_ID}/orders`, body);
  if (data && data.success === false) throw new Error(data.message || "주문 실패");

  const amount = orderItems.reduce((s, it) => s + it.price * it.quantity, 0);
  return { orderId: data?.data?.orderId ?? data?.data?.id ?? null, amount };
}
