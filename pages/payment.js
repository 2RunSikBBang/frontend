// pages/payment.js
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import useOrderStore from "../store/orderStore";
import Layout from "../components/Layout";
import { hasActiveOrderStrict } from "../utils/validators";
import { createGuestOrder } from "../services/guestApi";

// 화면 표시용 라인
const BANK_LINE = "토스뱅크 1002-1965-8689 김유미(모임통장)";

// 복사용: 숫자만
function extractAccountDigits(line) {
  return String(line).replace(/\D/g, "");
}

export default function PaymentPage() {
  const router = useRouter();
  const { items, customer, resetOrder } = useOrderStore();

  const [copied, setCopied] = useState(false);
  const [submitting, setSubmitting] = useState(false); // 서버 주문 생성 중

  // 활성 주문 판단(로컬)
  const hasActiveOrder = hasActiveOrderStrict(customer, items);

  // 총액
  const totalPrice = useMemo(
    () => (Array.isArray(items) ? items.reduce((sum, it) => sum + it.price * it.quantity, 0) : 0),
    [items]
  );

  // 활성 주문 없으면 주문화면으로
  useEffect(() => {
    if (!hasActiveOrder) router.replace("/order");
  }, [hasActiveOrder, router]);

  // 계좌 복사(숫자만)
  async function copyAccount() {
    const digitsOnly = extractAccountDigits(BANK_LINE);
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

  // 송금 완료 → 이때 서버에 주문 생성 → /status
  const handlePaymentComplete = async () => {
    if (submitting) return;
    try {
      setSubmitting(true);

      // 서버에 실제 주문 생성 (이제 여기서!)
      const payload = {
        customer: {
          name: customer.name,
          phone: customer.phone,
          address: customer.address,
        },
        items: items.map((m) => ({
          id: m.id,
          name: m.name,
          price: m.price,
          quantity: m.quantity,
        })),
      };
      await createGuestOrder(payload);

      alert("송금 완료 확인 요청을 보냈습니다.");
      const cleaned = String(customer.phone || "").replace(/\D/g, "");
      router.push(`/status?phone=${encodeURIComponent(cleaned)}`);
    } catch (e) {
      alert(e?.message || "주문 생성에 실패했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setSubmitting(false);
    }
  };

  // 주문 취소 → 로컬 초기화 + 원하는 경로로 이동
  const handleCancel = () => {
    if (window.confirm("주문을 취소하시겠습니까?")) {
      resetOrder();          // 이름/전화/주소/아이템 초기화
      router.push("/");
    }
  };

  if (!hasActiveOrder) {
    return (
      <Layout>
        <div className="text-center py-12 text-sm text-gray-500">이동 중…</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <h1 className="text-xl font-bold text-center my-4">결제가 필요해요</h1>
      <p className="text-center text-sm mb-4">
        주문내역은 잘 접수되었어요. 입금 확인 후 조리가 시작돼요.
      </p>

      {/* 주문 내역 */}
      <div className="bg-white p-4 rounded-xl shadow mb-4">
        <h2 className="font-bold mb-2">1. 주문 내역</h2>
        {items.length > 0 ? (
          <ul className="mb-2">
            {items.map((item) => (
              <li key={item.id}>
                {item.name} x {item.quantity}개
              </li>
            ))}
          </ul>
        ) : (
          <p>주문 내역이 없습니다.</p>
        )}
        <p className="font-bold">총 금액: {totalPrice.toLocaleString("ko-KR")}원</p>
      </div>

      {/* 주문자 정보 */}
      <div className="bg-white p-4 rounded-xl shadow mb-4">
        <h2 className="font-bold mb-2">2. 주문자 정보</h2>
        <p>성명: {customer.name}</p>
        <p>연락처: {customer.phone}</p>
        <p>주소: {customer.address}</p>
      </div>

      {/* 결제 계좌 + 복사 버튼(숫자만) + 안내문 */}
      <div className="bg-white p-4 rounded-xl shadow mb-4">
        <h2 className="font-bold mb-2">3. 입금하실 계좌번호</h2>
        <p className="text-sm mb-4">주문자명과 입금자명이 일치해야 합니다.</p>

        <div className="flex items-center justify-center gap-2">
          <p className="text-center font-bold select-all">{BANK_LINE}</p>
          <button
            type="button"
            onClick={copyAccount}
            className="shrink-0 bg-gray-800 text-white text-xs px-2 py-1 rounded-lg active:scale-95"
            aria-label="계좌번호 복사"
            title="계좌번호 복사"
          >
            복사
          </button>
        </div>
        {copied && <p className="text-center text-xs text-green-600 mt-1">계좌번호가 복사됐어요</p>}

        <p className="text-center text-blue-500 font-bold mt-3">
          입금할 금액: {totalPrice.toLocaleString("ko-KR")}원
        </p>

        {/* 안내문 */}
        <div className="mt-3 text-xs text-gray-600 leading-relaxed text-center">
          <p>주문내역 확인 시, <b>아직 송금 전이라면 주문이 거절</b>될 수 있어요.</p>
        </div>
      </div>

      {/* 버튼 */}
      <div className="space-y-2">
        <button
          className="w-full bg-green-400 text-black font-bold py-3 rounded-xl disabled:opacity-60"
          onClick={handlePaymentComplete}
          disabled={submitting || !hasActiveOrder || totalPrice <= 0}
        >
          {submitting ? "처리 중…" : "송금 완료했어요"}
        </button>
        <button
          className="w-full bg-gray-300 text-black font-bold py-3 rounded-xl"
          onClick={handleCancel}
          disabled={submitting}
        >
          주문 취소하기
        </button>
      </div>
    </Layout>
  );
}
