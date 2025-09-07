import { create } from "zustand";
import { persist } from "zustand/middleware";

const useOrderStore = create(
  persist(
    (set) => ({
      customer: { name:"", phone:"", address:"" },
      items: [],
      orderId: null,
      setCustomer: (customer) => set({ customer }),
      setItems: (items) => set({ items }),
      setOrderId: (id) => set({ orderId: id }),
      resetOrder: () => set({ customer:{ name:"", phone:"", address:"" }, items:[], orderId:null }),
    }),
    { name: "thiswaybread_order" } // localStorage 키
  )
);

export default useOrderStore;

