import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
  withCredentials: true,
  timeout: 10000,
  headers: { "Content-Type": "application/json" },
});

// 토큰 & 스토어ID 키
const TOKEN_KEY = "__op_token__";
const OP_STORE_KEY = "__op_store_id__";

/** 토큰 저장(+Axios 헤더 세팅) */
export function setAuthToken(token) {
  if (!token) return;
  api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  if (typeof window !== "undefined") sessionStorage.setItem(TOKEN_KEY, token);
}

/** 토큰/스토어ID 제거 */
export function clearAuthToken() {
  delete api.defaults.headers.common["Authorization"];
  if (typeof window !== "undefined") {
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(OP_STORE_KEY);
  }
}

/** 현재 토큰 조회 */
export function getAuthToken() {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(TOKEN_KEY);
}

/** 로그인에서 선택한 storeId 저장/조회 */
export function setOperatorStoreId(storeId) {
  if (typeof window !== "undefined")
    sessionStorage.setItem(OP_STORE_KEY, String(storeId));
}
export function getOperatorStoreId() {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(OP_STORE_KEY);
}

/** 새로고침 시 Axios 헤더 복구 */
(function bootstrapAuth() {
  if (typeof window !== "undefined") {
    const t = sessionStorage.getItem(TOKEN_KEY);
    if (t) api.defaults.headers.common["Authorization"] = `Bearer ${t}`;
  }
})();

export default api;
