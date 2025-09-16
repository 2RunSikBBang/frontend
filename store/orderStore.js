// /store/orderStore.js
import { create } from "zustand";
import { persist } from "zustand/middleware";

const useOrderStore = create(
  persist(
    (set) => ({
      customer: { name: "", phone: "", address: "" },
      items: [],
      setCustomer: (customer) => set({ customer }),
      setItems: (items) => set({ items }),
      resetOrder: () =>
        set({ customer: { name: "", phone: "", address: "" }, items: [] }),
    }),
    { name: "thiswaybread_order" } // 기존 키 유지(로컬에 남아있는 orderId는 그냥 무시됨)
  )
);

export default useOrderStore;


