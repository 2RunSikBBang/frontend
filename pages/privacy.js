import Link from "next/link";
import Layout from "../components/Layout";

export default function PrivacyPage() {
  const lastUpdated = "2025-09-09"; // 수정 시 갱신

  return (
    <Layout>
      <h1 className="text-2xl font-extrabold text-center my-4">개인정보처리방침</h1>

      <div className="bg-white p-5 rounded-xl shadow space-y-4 text-sm leading-relaxed">
        <p>
          이런식빵(이하 “서비스”)은 주문 접수 및 배달 서비스 제공을 위해 필요한 최소한의
          개인정보를 수집·이용합니다. 본 방침은 서비스 이용 중 처리되는 개인정보의 항목,
          목적, 보관기간, 제3자 제공 여부 등을 고지하기 위한 것입니다.
        </p>

        <section>
          <h2 className="font-bold mb-1">1. 개인정보 수집·이용 목적</h2>
          <ul className="list-disc pl-5">
            <li>주문 접수 및 확인, 배달 서비스 제공</li>
            <li>결제 확인 및 주문 상태 안내</li>
            <li>고객 문의 대응</li>
          </ul>
        </section>

        <section>
          <h2 className="font-bold mb-1">2. 수집하는 개인정보 항목</h2>
          <ul className="list-disc pl-5">
            <li>성명, 휴대폰 번호, 배달 주소</li>
          </ul>
        </section>

        <section>
          <h2 className="font-bold mb-1">3. 보유·이용 기간</h2>
          <ul className="list-disc pl-5">
            <li>보관 기간: 학교 축제 운영 기간 동안에 한하여 보관합니다.</li>
            <li>
              파기 시점: 행사 종료 즉시(가능한 지체 없이) 전자적 파일을 안전한 방법으로
              영구 삭제합니다.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="font-bold mb-1">4. 동의 거부 권리 및 불이익</h2>
          <p>
            귀하는 개인정보 수집·이용에 동의하지 않을 권리가 있습니다. 다만, 필수 항목에
            대한 동의를 거부할 경우 주문 접수 및 배달 서비스 이용이 불가능합니다.
          </p>
        </section>

        <section>
          <h2 className="font-bold mb-1">5. 제3자 제공 및 처리 위탁</h2>
          <ul className="list-disc pl-5">
            <li>제3자에게 개인정보를 제공하지 않습니다.</li>
            <li>개인정보 처리 위탁을 하지 않습니다.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-bold mb-1">6. 이용자의 권리</h2>
          <ul className="list-disc pl-5">
            <li>본인 확인 후 열람·정정·삭제를 요청할 수 있습니다.</li>
            <li>
              행사 기간 중 개인정보 처리에 관한 문의는 아래 문의처로 연락 주시면 가능한 범위에서 지체 없이 조치합니다.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="font-bold mb-1">7. 문의처</h2>
          <p>
            운영 담당자: 010-8872-2382
            <span className="text-gray-500"></span>
          </p>
        </section>

        <p className="text-gray-500">시행/최종 업데이트: {lastUpdated}</p>
      </div>

      <div className="mt-4 text-center">
        <Link href="/">
          <button className="w-full bg-gray-300 text-black font-bold py-3 rounded-xl">
            메인으로
          </button>
        </Link>
      </div>
    </Layout>
  );
}
