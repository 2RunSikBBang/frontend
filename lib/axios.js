// lib/axios.js
import axios from "axios";

// ▶ 게스트(공개) 호출: 쿠키 불필요, 동일 오리진 "/api"
export const apiPublic = axios.create({
  baseURL: "/api",
  withCredentials: false,
  timeout: 10000,
  headers: { "Content-Type": "application/json" },
});

// ▶ 운영자/관리자 호출: 토큰 헤더 사용
const api = axios.create({
  baseURL: "/api",
  withCredentials: true,
  timeout: 10000,
  headers: { "Content-Type": "application/json" },
});

// ===== 토큰 & 스토어ID 유틸 =====
const TOKEN_KEY = "__op_token__";
const OP_STORE_KEY = "__op_store_id__";

export function setAuthToken(token) {
  if (!token) return;
  api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  if (typeof window !== "undefined") sessionStorage.setItem(TOKEN_KEY, token);
}
export function clearAuthToken() {
  delete api.defaults.headers.common["Authorization"];
  if (typeof window !== "undefined") {
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(OP_STORE_KEY);
  }
}
export function getAuthToken() {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(TOKEN_KEY);
}
export function setOperatorStoreId(storeId) {
  if (typeof window !== "undefined")
    sessionStorage.setItem(OP_STORE_KEY, String(storeId));
}
export function getOperatorStoreId() {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(OP_STORE_KEY);
}

// 새로고침 시 Axios 헤더 복구
(function bootstrapAuth() {
  if (typeof window !== "undefined") {
    const t = sessionStorage.getItem(TOKEN_KEY);
    if (t) api.defaults.headers.common["Authorization"] = `Bearer ${t}`;
  }
})();

export default api;
