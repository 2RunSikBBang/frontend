import { useEffect, useMemo } from "react";
import { useRouter } from "next/router";
import useOrderStore from "../store/orderStore";
import Layout from "../components/Layout";
import { hasActiveOrderStrict } from "../utils/validators";

export default function PaymentPage() {
  const router = useRouter();
  const { items, customer, resetOrder } = useOrderStore();

  // 활성 주문 판단: 메뉴가 있고, 이름이 비어있지 않을 때
  const hasActiveOrder = hasActiveOrderStrict(customer, items);

  // 총액 계산(메모이제이션 useMemo)
  const totalPrice = useMemo(
    () => items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [items]
  );

  // 활성 주문이 없으면 메인으로 돌려보내기
  // 🔁 [CHANGE] 유효하지 않으면 메인이 아니라 주문화면으로 유도 (바로 수정 가능)
  useEffect(() => {
    if (!hasActiveOrder) {
      router.replace("/order");
    }
  }, [hasActiveOrder, router]);

  const handlePaymentComplete = () => {
    alert("송금 완료 확인 요청을 보냈습니다.");
    router.push("/status");
  };

  const handleCancel = () => {
    if (window.confirm("주문을 취소하시겠습니까?")) {
      resetOrder();
      router.push("/");
    }
  };

  // 리다이렌트 직전 잠깐 깜빡임 방지
  if (!hasActiveOrder) {
    return (
      <Layout>
        <div className="text-center py-12 text-sm text-gray-500">
          이동 중…
        </div>
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

      {/* 결제 계좌 */}
      <div className="bg-white p-4 rounded-xl shadow mb-4">
        <h2 className="font-bold mb-2">3. 입금하실 계좌번호</h2>
        <p className="text-sm mb-4">주문자명과 입금자명이 일치해야 합니다.</p>
        <p className="text-center font-bold">신한은행 110-218-986002 김효원</p>
        <p className="text-center text-blue-500 font-bold">
          입금할 금액: {totalPrice.toLocaleString("ko-KR")}원
        </p>
      </div>

      {/* 버튼 */}
      <div className="space-y-2">
        <button
          className="w-full bg-green-400 text-black font-bold py-3 rounded-xl"
          onClick={handlePaymentComplete}
          disabled={!hasActiveOrder || totalPrice <= 0}
        >
          송금 완료했어요
        </button>
        <button
          className="w-full bg-gray-300 text-black font-bold py-3 rounded-xl"
          onClick={handleCancel}
        >
          주문 취소하기
        </button>
      </div>
    </Layout>
  );
}

