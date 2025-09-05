import { useState } from "react";
import { useRouter } from "next/router";
import useOrderStore from "../store/orderStore";
import Layout from "../components/Layout";

export default function OrderPage() {
  const router = useRouter();
  const { setCustomer, setItems } = useOrderStore();

  // 메뉴 정의
  const menuList = [
    { id: 1, name: "누텔라바나나 토스트(하프)", price: 3500 },
    { id: 2, name: "누텔라바나나 토스트(풀)", price: 5500 },
    { id: 3, name: "블루베리크림치즈 토스트(하프)", price: 3500 },
    { id: 4, name: "블루베리크림치즈 토스트(풀)", price: 5500 },
  ];

  // 로컬 상태 (UI 조작용)
  const [quantities, setQuantities] = useState(
    menuList.reduce((acc, menu) => {
      acc[menu.id] = 0;
      return acc;
    }, {})
  );
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  // 수량 변경
  const handleQuantity = (id, delta) => {
    setQuantities((prev) => ({
      ...prev,
      [id]: Math.max(0, prev[id] + delta),
    }));
  };

  // 총 금액 계산
  const totalPrice = menuList.reduce(
    (sum, menu) => sum + menu.price * quantities[menu.id],
    0
  );

  // 주문 접수
  const handleOrderSubmit = () => {
    const selectedItems = menuList
      .filter((menu) => quantities[menu.id] > 0)
      .map((menu) => ({
        ...menu,
        quantity: quantities[menu.id],
      }));
    setItems(selectedItems);
    setCustomer({ name, phone, address });
    router.push("/payment");
  };

  return (
    <Layout>
      <h1 className="text-xl font-bold text-center my-4">배달 주문하기</h1>

      {/* 메뉴 선택 */}
      <div className="bg-white p-4 rounded-xl shadow mb-4">
        <h2 className="font-bold mb-2">
          1. 메뉴 선택{" "}
          <span className="text-red-500 text-sm">(하프 3,500원 | 풀 5,500원)</span>
        </h2>
        {menuList.map((menu) => (
          <div
            key={menu.id}
            className="flex justify-between items-center mb-2"
          >
            <span>{menu.name}</span>
            <div className="flex items-center space-x-2">
              <button
                className="px-2 py-1 bg-red-300 rounded"
                onClick={() => handleQuantity(menu.id, -1)}
              >
                -
              </button>
              <span>{quantities[menu.id]}</span>
              <button
                className="px-2 py-1 bg-blue-300 rounded"
                onClick={() => handleQuantity(menu.id, +1)}
              >
                +
              </button>
            </div>
          </div>
        ))}
        <p className="font-bold mt-2">총 주문금액: {totalPrice.toLocaleString()}원</p>
      </div>

      {/* 주문자 정보 입력 */}
      <div className="bg-white p-4 rounded-xl shadow mb-4">
        <h2 className="font-bold mb-2">2. 주문자 정보 입력</h2>
        <input
          type="text"
          placeholder="성명"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full border rounded p-2 mb-2"
        />
        <input
          type="text"
          placeholder="연락처 (010-1234-1234)"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="w-full border rounded p-2 mb-2"
        />
        <textarea
          placeholder="배송 받으실 주소 (OO관 OO호 형식으로 자세히 작성해주세요!)"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          className="w-full border rounded p-2 mb-2"
        />
      </div>

      {/* 주문 버튼 */}
      <button
        className="w-full bg-yellow-400 text-black font-bold py-3 rounded-xl"
        onClick={handleOrderSubmit}
      >
        주문 접수하기
      </button>
    </Layout>
  );
}
