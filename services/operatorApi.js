// services/operatorApi.js
import api, {
  setAuthToken,
  clearAuthToken,
  setOperatorStoreId,
  getOperatorStoreId,
} from "../lib/axios";

/** 외부에서 현재 storeId가 필요할 때 사용 */
export function getCurrentStoreId() {
  const sid = getOperatorStoreId() || process.env.NEXT_PUBLIC_STORE_ID;
  return String(sid ?? "").trim();
}

function unwrapOrThrow(respData, fallback) {
  if (respData && respData.success === false) {
    throw new Error(respData.message || fallback);
  }
  return respData?.data ?? null;
}

// 주문 표준화 (관리자/게스트 동일 형태)
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
    items,
  };
}

/** 로그인 */
export async function operatorLogin({ storeId, password }) {
  const resp = await api.post(
    "/store/login",
    { storeId, password },
    { headers: { Authorization: undefined } }
  );
  const body = resp?.data;
  unwrapOrThrow(body, "로그인 실패");

  const headerAuth = resp?.headers?.authorization;
  const headerToken = typeof headerAuth === "string" ? headerAuth.replace(/^Bearer\s+/i, "") : null;
  const bodyToken =
    typeof body?.data === "string"
      ? body.data
      : body?.data?.token || body?.data?.accessToken || null;

  const token = headerToken || bodyToken;
  if (!token) throw new Error("로그인 성공했지만 토큰이 없습니다.");

  setAuthToken(token);
  setOperatorStoreId(storeId);
  return true;
}

export function operatorLogout() {
  clearAuthToken();
  return true;
}

/** 주문 목록: GET /store/{sid}/orders → 표준화 배열 */
export async function listStoreOrders(params = {}) {
  const sid = getCurrentStoreId();
  const resp = await api.get(`/store/${sid}/orders`, { params });
  const data = unwrapOrThrow(resp?.data, "주문 목록 실패");
  const rows = Array.isArray(data) ? data : data ? [data] : [];
  return rows.map(normalizeOrder);
}

/** 주문 상태 변경 */
export async function updateOrderStatus(orderId, status) {
  const sid = getCurrentStoreId();
  const resp = await api.put(`/store/${sid}/orders/${orderId}/status`, { status });
  unwrapOrThrow(resp?.data, "주문 상태 변경 실패");
  return true;
}

/** 가게 상태 조회(운영자용) → { statusMessage: string, ...원하면 확장 } */
export async function getStoreInfoForOperator() {
  const sid = getCurrentStoreId();
  const resp = await api.get(`/store/${sid}/info`);
  const info = unwrapOrThrow(resp?.data, "가게 상태 조회 실패");
  return {
    id: info?.id ?? sid,
    name: String(info?.name || ""),
    profileImageUrl: info?.profileImageUrl || "",
    productImageUrls: Array.isArray(info?.productImageUrls) ? info.productImageUrls : [],
    refundPolicy: String(info?.refundPolicy || ""),
    bankAccount: String(info?.bankAccount || ""),
    cancelPhoneNumber: String(info?.cancelPhoneNumber || ""),
    statusMessage: String(info?.statusMessage || ""),
  };
}

/** 가게 상태 변경 */
export async function updateStoreStatus(next) {
  const sid = getCurrentStoreId();
  const status = String((typeof next === "string" ? next : next?.status) || "")
    .trim()
    .toUpperCase();

  const ALLOWED = new Set(["OPEN", "DELAYED", "UNAVAILABLE", "NOT_READY"]);
  if (!ALLOWED.has(status)) {
    throw new Error(`유효하지 않은 상태: ${status} (허용: OPEN, DELAYED, UNAVAILABLE, NOT_READY)`);
  }

  const resp = await api.put(`/store/${sid}/status`, { status });
  unwrapOrThrow(resp?.data, "가게 상태 변경 실패");
  return true;
}

/** 주문 삭제: DELETE /store/{sid}/orders/{orderId}
 *  응답: { success, code, message, data: { orderId, status: "deleted" } }
 */
export async function deleteOrder(orderId) {
  const sid = getCurrentStoreId();
  const resp = await api.delete(`/store/${sid}/orders/${orderId}`);
  const data = unwrapOrThrow(resp?.data, "주문 삭제 실패");
  return data; // { orderId, status: "deleted" }
}
