import { useState } from "react";
import Link from "next/link";
import useOrderStore from "../store/orderStore";
import Layout from "../components/Layout";
import { hasActiveOrderStrict } from "../utils/validators";

export default function StatusPage() {
  const { items, customer } = useOrderStore();

  // 활성 주문확인
  const hasActiveOrder = hasActiveOrderStrict(customer, items);

  const [status, setStatus] = useState("확인중"); 
  // 가능한 값: "확인중", "조리중", "배달중", "완료", "취소"

  const handleRefresh = () => {
    const nextStatus = {
      확인중: "조리중",
      조리중: "배달중",
      배달중: "완료",
      완료: "완료",
      취소: "취소",
    };
    setStatus(nextStatus[status] || "확인중");
  };

  // 활성 주문이 없으면 주문 내역이 없다고 띄움
  if (!hasActiveOrder) {
    return (
      <Layout>
        <h1 className="text-xl font-bold text-center my-4">주문 현황</h1>
        <div className="bg-white p-6 rounded-xl shadow text-center">
          <p className="font-bold mb-2">주문 내역이 없습니다.</p>
          <p className="text-sm text-gray-500 mb-4">
            메인 화면에서 주문을 접수해 주세요.
          </p>
          <Link href="/">
            <button className="w-full bg-yellow-400 text-black font-bold py-3 rounded-xl">
              메인으로
            </button>
          </Link>
        </div>
      </Layout>
    );
  }

  // 활성 주문이 있다면 정보 띄우고 배송 현황 출력
  return (
    <Layout>
      <h1 className="text-xl font-bold text-center my-4">주문 현황</h1>

      {/* 주문자 정보 */}
      <div className="bg-white p-4 rounded-xl shadow mb-4">
        <h2 className="font-bold mb-2">주문자</h2>
        <p>성명: {customer.name || "홍길동"}</p>
        <p>연락처: {customer.phone || "010-0000-0000"}</p>
        <p>주소: {customer.address || "주소 없음"}</p>
      </div>

      {/* 주문 내역 */}
      <div className="bg-white p-4 rounded-xl shadow mb-4">
        <h2 className="font-bold mb-2">주문 내역</h2>
        {items.length > 0 ? (
          <ul>
            {items.map((item) => (
              <li key={item.id}>
                {item.name} x {item.quantity}개
              </li>
            ))}
          </ul>
        ) : (
          <p>주문 내역이 없습니다.</p>
        )}
      </div>

      {/* 주문 현황 */}
      <div className="bg-white p-6 rounded-xl shadow text-center mb-4">
        <h2 className="font-bold mb-2">현재 상태</h2>
        {status === "확인중" && (
          <p className="text-blue-500 font-bold">주문을 확인하고 있습니다</p>
        )}
        {status === "조리중" && (
          <p className="text-orange-500 font-bold">조리중입니다 🍞</p>
        )}
        {status === "배달중" && (
          <p className="text-green-500 font-bold">배달중입니다 🛵</p>
        )}
        {status === "완료" && (
          <p className="text-gray-700 font-bold">배달이 완료되었습니다 ✅</p>
        )}
        {status === "취소" && (
          <p className="text-red-500 font-bold">
            미입금으로 주문이 취소되었습니다 ❌
          </p>
        )}
        <p>주문내역 확인 시, 아직 송금 전이라면 주문이 거절될 수 있어요.</p>
        <p>주문 및 결제 후 취소는 전화로만 가능합니다.</p>
        <p>취소 요청: 010-1111-2222</p>
      </div>

      {/* 새로고침 버튼 */}
      <button
        className="w-full bg-yellow-400 text-black font-bold py-3 rounded-xl"
        onClick={handleRefresh}
      >
        새로고침
      </button>
    </Layout>
  );
}
