import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import AdminLayout from "../../components/AdminLayout";
import { useAdminStore } from "../../store/adminStore";


export default function AdminLoginPage() {
const router = useRouter();
const { loggedIn, login } = useAdminStore();
const [pw, setPw] = useState("");
const [err, setErr] = useState("");
const ADMIN = process.env.NEXT_PUBLIC_ADMIN_CODE || ""; // 스켈레톤: 환경변수 비교


useEffect(() => {
if (loggedIn) router.replace("/admin/orders");
}, [loggedIn, router]);


function submit(e) {
e.preventDefault();
if (!pw) return setErr("비밀번호를 입력해주세요.");
if (pw === ADMIN) {
sessionStorage.setItem("__is_admin__", "1");
login();
router.replace("/admin/orders");
} else {
setErr("비밀번호가 올바르지 않습니다.");
}
}


return (
<AdminLayout>
<form onSubmit={submit} className="space-y-6">
<h2 className="text-center text-2xl font-extrabold">관리자 암호 입력</h2>
<input
type="password"
placeholder="******"
value={pw}
onChange={(e)=>setPw(e.target.value)}
className="w-full rounded-2xl bg-white px-4 py-3 border focus:outline-none"
/>
{err && <p className="text-sm text-red-600">{err}</p>}
<button type="submit" className="w-full rounded-2xl bg-[#79A861] py-3 text-lg font-bold">
접속
</button>
</form>
</AdminLayout>
);
}