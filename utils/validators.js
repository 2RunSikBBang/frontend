export const isNonEmpty = (v) => typeof v === "string" && v.trim().length > 0;

// 010-1234-1234 형식
export const isValidPhone = (v) => /^010-\d{4}-\d{4}$/.test(v);

// 활성 주문 조건: 메뉴 있음 + 이름/전화/주소 모두 유효
export const hasActiveOrderStrict = (customer, items) =>
  Array.isArray(items) &&
  items.length > 0 &&
  isNonEmpty(customer?.name) &&
  isValidPhone(customer?.phone) &&
  isNonEmpty(customer?.address);

// 입력 중 자동 포맷용: 숫자만 받아 010-1234-1234로 변환
export const formatPhoneKR = (raw) => {
  const d = String(raw || "").replace(/\D/g, "").slice(0, 11); // 최대 11자리
  // 010으로 시작하는 11자리만 허용
  if (!d.startsWith("010")) return d; // 잘못된 시작이면 그냥 숫자만 반환
  if (d.length <= 3) return d;
  if (d.length <= 7) return `${d.slice(0, 3)}-${d.slice(3)}`;
  return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7)}`;
};
