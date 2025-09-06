import { create } from "zustand";


export const useAdminStore = create((set) => ({
loggedIn: false,
login: () => set({ loggedIn: true }),
logout: () => {
if (typeof window !== "undefined") sessionStorage.removeItem("__is_admin__");
set({ loggedIn: false });
},
}));


if (typeof window !== "undefined") {
if (sessionStorage.getItem("__is_admin__") === "1") {
// 새로고침해도 로그인 유지
useAdminStore.setState({ loggedIn: true });
}
}