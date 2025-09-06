import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import AdminLayout from "../../components/AdminLayout";
import { useAdminStore } from "../../store/adminStore";


const DUMMY = [
{
id: "o2",
no: 2,
name: "홍길동",
phone: "010-1234-1234",
address: "단대앞 / ○○학 312호 홍길동",
items: [
{ name: "바나나 누텔라", size: "풀", qty: 1 },
{ name: "블루베리 크림치즈", size: "풀", qty: 1 },
],
status: "조리중입니다…",
createdAt: new Date().getTime() - 3 * 60 * 1000,
},
{
id: "o1",
no: 1,
name: "홍길동",
phone: "010-1234-1234",
address: "단대앞 / ○○학 312호 홍길동",
items: [
{ name: "바나나 누텔라", size: "풀", qty: 1 },
{ name: "블루베리 크림치즈", size: "풀", qty: 1 },
],
status: "배송완료",
createdAt: new Date().getTime() - 60 * 60 * 1000,
},
];


export default function AdminOrdersPage() {
const router = useRouter();
const { loggedIn, logout } = useAdminStore();
const [orders, setOrders] = useState([]);
const [active, setActive] = useState(null); // 상태변경 모달 표시용


useEffect(() => {
if (!loggedIn) router.replace("/admin");
}, [loggedIn, router]);


useEffect(() => {
// 스켈레톤: 더미를 최신순으로 세팅
setOrders(
[...DUMMY].sort((a,b) => b.createdAt - a.createdAt)
);
}, []);


return (
<AdminLayout>
<h2 className="text-center text-2xl font-extrabold mb-4">실시간 주문 내역</h2>


<div className="space-y-3 mb-5">
<button className="w-full rounded-2xl bg-[#F3C35C] py-3 text-lg font-bold">새로고침</button>
<a href="/admin/store" className="block w-full text-center rounded-2xl bg-[#6AA457] text-white py-3 text-lg font-bold">가게 상태 변경</a>
<button onClick={()=>{ logout(); router.replace('/admin'); }} className="w-full rounded-2xl bg-[#C8C8C8] py-3 text-lg font-bold">로그아웃</button>
</div>

<ul className="space-y-4">
{orders.map((o) => (
<li key={o.id} className="rounded-2xl bg-white p-4 border border-black/10" onClick={()=>setActive(o)}>
<div className="flex items-start justify-between">
<div>
<div className="font-bold">주문 일시 : {new Date(o.createdAt).toLocaleString()}</div>
<div className="text-sm text-gray-600">주문 번호 : {String(o.no).padStart(5,'0')}</div>
</div>
</div>
<div className="mt-2 font-semibold">{o.name} / {o.phone}</div>
<div className="text-sm text-gray-700">{o.address}</div>
<ul className="mt-2 text-sm list-disc pl-5">
{o.items.map((it, i) => (
<li key={i}>{it.name} ({it.size}) · {it.qty}개</li>
))}
</ul>
<div className="mt-2 text-sm"><b>현재 상태 :</b> <span className="text-blue-600 font-semibold">{o.status}</span></div>
</li>
))}
</ul>


{/* 상태변경 모달(스켈레톤) */}
{active && (
<div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center sm:justify-center" onClick={()=>setActive(null)}>
<div className="w-full sm:w-[360px] rounded-2xl bg-[#efefef] p-4 m-3" onClick={(e)=>e.stopPropagation()}>
<div className="font-bold">주문 번호 : {String(active.no).padStart(5,'0')}</div>
<div className="text-sm mb-4">현재 상태 : <b>주문을 확인하고 있습니다.</b></div>
<button className="w-full rounded-2xl bg-neutral-800 text-white py-3 font-bold mb-3">주문 확인중</button>
<button className="w-full rounded-2xl bg-blue-500 text-white py-3 font-bold mb-3">조리중</button>
<button className="w-full rounded-2xl bg-amber-400 py-3 font-bold mb-3">배송중</button>
<button className="w-full rounded-2xl bg-green-600 text-white py-3 font-bold mb-3">배송완료</button>
<button className="w-full rounded-2xl bg-red-600 text-white py-3 font-bold mb-3">주문취소</button>
<button className="w-full rounded-2xl bg-gray-400 py-3 font-bold" onClick={()=>setActive(null)}>닫기</button>
</div>
</div>
)}
</AdminLayout>
);
}