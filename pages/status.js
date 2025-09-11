// pages/status.js
import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import useOrderStore from "../store/orderStore";
import Layout from "../components/Layout";
import { hasActiveOrderStrict } from "../utils/validators";

export default function StatusPage() {
  const router = useRouter();
  const { items, customer } = useOrderStore();

  const [status, setStatus] = useState("확인중"); // 데모용 상태
  const handleRefresh = () => {
    const next = {
      확인중: "조리중",
      조리중: "배달중",
      배달중: "완료",
      완료: "완료",
      취소: "취소",
    };
    setStatus(next[status] || "확인중");
  };

  // 1) 우선순위: 쿼리 ?phone → 없으면 Zustand의 customer.phone
  const queryPhone =
    typeof router.query.phone === "string" ? router.query.phone : "";
  const phoneToUse = queryPhone || customer?.phone || "";

  // 2) 활성 주문 판단(이름/전화/주소+아이템 모두 유효)
  const hasActiveOrder = hasActiveOrderStrict(customer, items);

  // 3) 표시 가능 여부
  //    - 쿼리폰이 있으면: 내 로컬 주문의 phone과 일치해야 함 (백엔드 전 단계)
  //    - 쿼리폰이 없으면: /payment 경로 → 로컬 주문만 있으면 OK
  const canShow = useMemo(() => {
    if (!hasActiveOrder) return false;
    if (queryPhone) return queryPhone === customer.phone;
    return true; // /payment → 로컬 주문 존재 시 통과
  }, [hasActiveOrder, queryPhone, customer?.phone]);

  // 4) 표시 불가 → /status-lookup 안내
  if (!phoneToUse || !canShow) {
    return (
      <Layout>
        <h1 className="text-xl font-bold text-center my-4">주문 현황</h1>
        <div className="bg-white p-6 rounded-xl shadow text-center">
          <p className="font-bold mb-2">해당 번호로 조회 가능한 주문이 없습니다.</p>
          <div className="space-y-2">
            <button
              className="w-full bg-yellow-400 text-black font-bold py-3 rounded-xl"
              onClick={() => router.replace("/status-lookup")}
            >
              휴대폰 번호로 조회하기
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
        <h2 className="font-bold mb-2">주문내역</h2>
        {items.length > 0 ? (
          <ul>
            {items.map((item) => (
              <li key={item.id}>
                {item.name} x {item.quantity}개
              </li>
            ))}
          </ul>
        ) : (
          <p>주문내역이 없습니다.</p>
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
          <p className="text-red-500 font-bold">미입금으로 주문이 취소되었습니다 ❌</p>
        )}
        <p>주문내역 확인 시, 아직 송금 전이라면 주문이 거절될 수 있어요.</p>
        <p>주문 및 결제 후 취소는 전화로만 가능합니다.</p>
        <p>취소 요청: 010-1111-2222</p>
      </div>

      {/* 액션 버튼 */}
      <div className="space-y-2">
        <button
          className="w-full bg-yellow-400 text-black font-bold py-3 rounded-xl"
          onClick={handleRefresh}
        >
          새로고침
        </button>
        <Link href="/">
          <button className="w-full bg-gray-300 text-black font-bold py-3 rounded-xl">
            메인화면으로
          </button>
        </Link>
      </div>
    </Layout>
  );
}
