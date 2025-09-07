import Link from "next/link";
import Layout from "../components/Layout";

export default function Home() {
  return (
    <Layout>
      <main className="flex flex-col gap-6 mt-20 w-4/5 mx-auto">
        <Link href="/order">
          <button className="w-full bg-yellow-400 font-bold py-4 rounded-xl shadow text-lg">
            🚴 배달 주문하기
          </button>
        </Link>

        <Link href="/status">
          <button className="w-full bg-green-500 font-bold py-4 rounded-xl shadow text-lg">
            내 주문내역 조회
          </button>
        </Link>
      </main>
    </Layout>
  );
}
