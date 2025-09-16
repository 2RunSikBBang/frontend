// pages/order.js
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { getMenus, getStoreInfo } from "../services/guestApi";
import useOrderStore from "../store/orderStore";
import Layout from "../components/Layout";
import Link from "next/link";
import { hasActiveOrderStrict, formatPhoneKR, isValidPhone } from "../utils/validators";

export default function OrderPage() {
  const router = useRouter();
  const { setCustomer, setItems } = useOrderStore();

  // --- API 데이터 상태 ---
  const [menuList, setMenuList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // --- UI 입력 상태 ---
  const [quantities, setQuantities] = useState({}); // { [menuId]: number }
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [consent, setConsent] = useState(false);

  // 메뉴 목록 불러오기
  useEffect(() => {
    async function fetchMenus() {
      try {
        const menus = await getMenus();
        const menuData = Array.isArray(menus) ? menus : [];
        setMenuList(menuData);
        setQuantities(
          menuData.reduce((acc, m) => {
            const minQ = Number.isFinite(m.minOrderQuantity) ? m.minOrderQuantity : 0;
            acc[m.id] = Math.max(0, Number(minQ) || 0);
            return acc;
          }, {})
        );
      } catch {
        setError("메뉴를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.");
      } finally {
        setLoading(false);
      }
    }
    fetchMenus();
  }, []);

  // 수량 변경 (min/max 클램프)
  const handleQuantity = (id, delta) => {
    const menu = menuList.find((m) => m.id === id);
    const minQ = Number.isFinite(menu?.minOrderQuantity) ? Number(menu.minOrderQuantity) : 0;
    const maxQ = Number.isFinite(menu?.maxOrderQuantity) ? Number(menu.maxOrderQuantity) : Infinity;

    setQuantities((prev) => {
      const cur = Number(prev[id] || 0);
      const next = cur + delta;
      const clamped = Math.min(maxQ, Math.max(minQ, next));
      return { ...prev, [id]: clamped };
    });
  };

  // 총 금액
  const totalPrice = menuList.reduce(
    (sum, menu) => sum + menu.price * (quantities[menu.id] || 0),
    0
  );

  // 전화번호 입력 포맷
  const handlePhoneChange = (e) => {
    const formatted = formatPhoneKR(e.target.value);
    setPhone(formatted);
  };

  // 선택된 아이템
  const selectedItems = menuList
    .filter((menu) => (quantities[menu.id] || 0) > 0)
    .map((menu) => ({ ...menu, quantity: quantities[menu.id] }));

  // 결제 진입 가능 여부
  const canProceed = hasActiveOrderStrict({ name, phone, address }, selectedItems);

  // 주문 접수(서버 호출 X): 최신 상태 가드 → 로컬 저장 → /payment로 이동
  const handleOrderSubmit = async () => {
    // 최신 상태 재확인
    try {
      const info = await getStoreInfo();
      const s = String(info?.status || "").toUpperCase();
      if (s === "NOT_READY") {
        alert("오픈 전이에요. 주문이 불가합니다.");
        return;
      }
      if (s === "UNAVAILABLE") {
        alert("지금은 주문이 불가능해요.");
        return;
      }
    } catch {
      alert("상태 확인에 실패했어요. 잠시 후 다시 시도해주세요.");
      return;
    }

    if (!consent) {
      alert("개인정보 수집·이용에 동의해 주세요.");
      return;
    }
    if (!canProceed) {
      alert("입력값을 확인해주세요.\n- 메뉴 선택\n- 이름\n- 전화번호(010-1234-1234)\n- 주소를 모두 입력해야 해요.");
      return;
    }

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
          <span className="text-red-500 text-sm">(반 3,300원 | 하나 5,500원)</span>
        </h2>

        {loading && <p className="text-sm text-gray-500">메뉴를 불러오는 중...</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}

        {!loading &&
          !error &&
          menuList.map((menu) => {
            const qty = Number(quantities[menu.id] || 0);
            const minQ = Number.isFinite(menu?.minOrderQuantity) ? Number(menu.minOrderQuantity) : 0;
            const maxQ = Number.isFinite(menu?.maxOrderQuantity) ? Number(menu.maxOrderQuantity) : Infinity;
            const atMin = qty <= minQ;
            const atMax = qty >= maxQ;

            return (
              <div key={menu.id} className="flex justify-between items-center mb-2">
                <div className="flex flex-col">
                  <span>{menu.name}</span>
                  {Number.isFinite(maxQ) && (
                    <span className="text-xs text-gray-500">최대 {maxQ}개까지 선택 가능</span>
                  )}
                  {minQ > 0 && (
                    <span className="text-xs text-gray-500">최소 {minQ}개부터 주문 가능</span>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    className={`px-2 py-1 rounded ${atMin ? "bg-gray-200 text-gray-500 cursor-not-allowed" : "bg-red-300"}`}
                    onClick={() => handleQuantity(menu.id, -1)}
                    disabled={atMin}
                    title={atMin ? `최소 ${minQ}개` : "수량 줄이기"}
                  >
                    -
                  </button>
                  <span>{qty}</span>
                  <button
                    className={`px-2 py-1 rounded ${atMax ? "bg-gray-200 text-gray-500 cursor-not-allowed" : "bg-blue-300"}`}
                    onClick={() => handleQuantity(menu.id, +1)}
                    disabled={atMax}
                    title={atMax ? `최대 ${maxQ}개` : "수량 늘리기"}
                  >
                    +
                  </button>
                </div>
              </div>
            );
          })}
        <p className="font-bold mt-2">
          총 주문금액: {totalPrice.toLocaleString("ko-KR")}원
        </p>
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
          type="tel"
          inputMode="numeric"
          placeholder="연락처 (010-1234-1234)"
          value={phone}
          onChange={handlePhoneChange}
          maxLength={13}
          className="w-full border rounded p-2 mb-1"
        />
        {!isValidPhone(phone) && phone.length > 0 && (
          <p className="text-xs text-blue-500 mb-2">전화번호는 010-1234-1234 형식이어야 해요.</p>
        )}
        <textarea
          placeholder="배송 받으실 주소 (OO관 OO호 형식으로 자세히 작성해주세요!)"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          className="w-full border rounded p-2 mb-2"
        />
        {address.length > 0 && (
          <p className="text-xs text-blue-500 mb-2">배달은 강원대학교 춘천캠퍼스 내에서만 가능해요.</p>
        )}
      </div>

      {/* 개인정보 수집·이용 동의 (필수) */}
      <div className="bg-white p-4 rounded-xl shadow mb-4 text-[12px]">
        <p className="font-bold mb-2">개인정보 수집·이용 안내</p>
        <ul className="list-disc pl-5 mb-2">
          <li>수집목적: 주문 접수, 결제 확인, 주문내역 조회, 배달 서비스 제공</li>
          <li>수집항목: 성명, 휴대폰 번호, 주소</li>
          <li>보유 및 이용 기간: 학교 축제 종료 시 즉시 파기</li>
          <li>동의 거부 권리: 거부하실 수 있으나, 미동의 시 배달 주문 이용이 불가합니다.</li>
        </ul>
        <label className="flex items-start gap-2">
          <input
            type="checkbox"
            className="mt-1"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
          />
          <span>
            위 내용을 확인하였으며, <b>개인정보 수집·이용에 동의합니다(필수)</b>.{" "}
            <Link href="/privacy" className="underline">자세히 보기</Link>
          </span>
        </label>

        {/* 비동의 액션 */}
        <button
          type="button"
          className="mt-3 w-full bg-gray-200 text-black font-bold py-2.5 rounded-lg"
          onClick={() => {
            alert("동의하지 않으면 배달 주문 서비스를 이용할 수 없습니다.");
            router.push("/");
          }}
        >
          동의하지 않습니다 (메인화면으로)
        </button>
      </div>

      {/* 주문 버튼 */}
      <button
        className="w-full bg-yellow-400 text-black font-bold py-3 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
        onClick={handleOrderSubmit}
        disabled={!consent || !canProceed || loading || error}
      >
        주문 접수하기
      </button>
    </Layout>
  );
}
