import { create } from "zustand";

const useOrderStore = create((set) => ({
  // 주문자 정보
  customer: {
    name: "",
    phone: "",
    address: "",
  },

  // 주문 메뉴 정보
  items: [],

  // 주문 ID (백엔드 연동 시 필요)
  orderId: null,

  // setter 함수들
  setCustomer: (customer) => set({ customer }),
  setItems: (items) => set({ items }),
  setOrderId: (id) => set({ orderId: id }),

  // 초기화
  resetOrder: () =>
    set({
      customer: { name: "", phone: "", address: "" },
      items: [],
      orderId: null,
    }),
}));

export default useOrderStore;
