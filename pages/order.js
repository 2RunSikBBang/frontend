import { useState, useEffect, useMemo } from "react";
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
  const [building, setBuilding] = useState("");     // 공과대학/백록관/국지원 등
  const [detailAddr, setDetailAddr] = useState(""); // 자유 입력(고정 빌딩이면 무시)
  const [consent, setConsent] = useState(false);

  // ─────────────────────────────────────────────────────────────
  // 배달 가능 지역 & 건물별 상세주소 고정 문구
  // - 기숙사(국지원/난지원/다산관/예지원/율곡관/퇴계관/새롬관 남/여) = 1층 수령 고정
  // - 이룸관 = 2층 수령 고정
  const BUILDING_OPTIONS = [
    "공과대학", "법학전문대학", "사회과학대학", "인문대학",
    "백록관", "서암관", "석재", "한빛관", "한울관", "60주년기념관",
    "국지원", "난지원", "다산관", "새롬관(남)", "새롬관(여)",
    "예지원", "율곡관", "이룸관", "퇴계관"
  ];

  const FIXED_DETAIL_BY_BUILDING = {
    "국지원": "1층에서 수령 바랍니다 (도착 전 전화 예정)",
    "난지원": "1층에서 수령 바랍니다 (도착 전 전화 예정)",
    "다산관": "1층에서 수령 바랍니다 (도착 전 전화 예정)",
    "예지원": "1층에서 수령 바랍니다 (도착 전 전화 예정)",
    "율곡관": "1층에서 수령 바랍니다 (도착 전 전화 예정)",
    "퇴계관": "1층에서 수령 바랍니다 (도착 전 전화 예정)",
    "새롬관(남)": "1층 CU 앞에서 수령 바랍니다 (도착 전 전화 예정)",
    "새롬관(여)": "1층에서 수령 바랍니다 (도착 전 전화 예정)",
    "이룸관": "2층에서 수령 바랍니다 (도착 전 전화 예정)",
  };

  const isFixedDetail = Boolean(FIXED_DETAIL_BY_BUILDING[building]);
  const displayDetail = isFixedDetail
    ? FIXED_DETAIL_BY_BUILDING[building]
    : detailAddr;
  // ─────────────────────────────────────────────────────────────


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

  // 총 금액 / 총 수량
  const totalPrice = useMemo(
    () => menuList.reduce((sum, m) => sum + m.price * (quantities[m.id] || 0), 0),
    [menuList, quantities]
  );
  const totalQty = useMemo(
    () => menuList.reduce((sum, m) => sum + (quantities[m.id] || 0), 0),
    [menuList, quantities]
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
  const canProceed = hasActiveOrderStrict(
    { name, phone, address: [building, displayDetail].filter(Boolean).join(" ") },
    selectedItems
  );

  // 주문 접수(서버 호출 X): 최신 상태 가드 → 유효성 체크 → 로컬 저장 → /payment 이동
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

    // 수량 2개 이상 필수
    if (totalQty < 2) {
      alert("배달은 2개 이상부터 가능해요");
      return;
    }

    // 지역/상세주소 검증
    if (!building) {
      alert("배달 지역을 선택해 주세요.");
      return;
    }
    if (!isFixedDetail && displayDetail.trim().length === 0) {
      alert("상세 주소를 입력해 주세요.");
      return;
    }

    if (!consent) {
      alert("개인정보 수집·이용에 동의해 주세요.");
      return;
    }
    if (!canProceed) {
      alert("입력값을 확인해주세요.\n- 메뉴 선택(2개 이상)\n- 이름\n- 전화번호(010-1234-1234)\n- 배달 지역/상세주소");
      return;
    }

    // 로컬 저장
    const fullAddress = [building, displayDetail].filter(Boolean).join(" ");
    setItems(selectedItems);
    setCustomer({ name, phone, address: fullAddress });

    router.push("/payment");
  };

  return (
    <Layout>
      <h1 className="text-xl font-bold text-center my-4">배달 주문하기</h1>

      {/* 메뉴 선택 */}
      <div className="bg-white p-4 rounded-xl shadow mb-4">
        <h2 className="font-bold mb-2">
          1. 메뉴 선택 - {" "}
          <span className="text-blue-500 text-base"> 개당 3,900원</span>
        </h2>

        {loading && <p className="text-sm text-gray-500">메뉴를 불러오는 중...</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}

        {!loading && !error && menuList.map((menu) => {
          const qty = Number(quantities[menu.id] || 0);
          const minQ = Number.isFinite(menu?.minOrderQuantity) ? Number(menu.minOrderQuantity) : 0;
          const maxQ = Number.isFinite(menu?.maxOrderQuantity) ? Number(menu.maxOrderQuantity) : Infinity;
          const atMin = qty <= minQ;
          const atMax = qty >= maxQ;

          return (
            <div key={menu.id} className="flex justify-between items-center mb-2">
              <div className="flex flex-col">
                <span>{menu.name}</span>
                {/* 최대 N개 안내 문구는 숨김(요청사항) */}
                {minQ > 0 && (
                  <span className="text-xs text-gray-500">최소 {minQ}개부터 배달 가능</span>
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
                  title={atMax ? "최대 수량에 도달" : "수량 늘리기"}
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
        <p className="text-xs text-gray-500 mt-1">현재 선택 수량: {totalQty}개 (2개 이상부터 주문 가능)</p>
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
          className="w-full border rounded p-2 mb-2"
        />
        {!isValidPhone(phone) && phone.length > 0 && (
          <p className="text-xs text-blue-500 mb-2">전화번호는 010-1234-1234 형식이어야 해요.</p>
        )}

        {/* 배달 지역 선택 */}
        <label className="block font-bold mt-2 mb-1">배달 지역</label>
        <select
          className="w-full border rounded p-2 mb-2 bg-white"
          value={building}
          onChange={(e) => setBuilding(e.target.value)}
        >
          <option value="">건물을 선택하세요</option>
          {BUILDING_OPTIONS.map((b) => (
            <option key={b} value={b}>{b}</option>
          ))}
        </select>

        {/* 상세 주소(고정/자유) */}
        <label className="block font-bold mb-1">상세 주소</label>
        <textarea
          placeholder={isFixedDetail ? "" : "예) 2호관 3층 301호, 1층 중앙로비 앞 등 수령 위치"}
          value={displayDetail}
          onChange={(e) => {
            if (!isFixedDetail) setDetailAddr(e.target.value);
          }}
          readOnly={isFixedDetail}
          className={`w-full border rounded p-2 mb-2 ${isFixedDetail ? "bg-gray-100 text-gray-700" : ""}`}
        />
        {building && (
          <p className="text-xs text-gray-500 mt-1">
            선택한 지역: <b>{building}</b>
            {isFixedDetail
              ? ` · 이 건물은 ${
                  /2층/.test(FIXED_DETAIL_BY_BUILDING[building]) ? "2층" : "1층"
            } 수령만 가능합니다(수정 불가).`
              : " · 수령 위치/호수 등을 자세히 적어주세요."}
          </p>
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
        disabled={!consent || !canProceed || totalQty < 2 || loading || error}
      >
        주문 접수하기
      </button>
    </Layout>
  );
}
