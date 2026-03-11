export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">개인정보처리방침</h1>
      <div className="prose prose-sm max-w-none text-muted-foreground">
        <h2 className="text-lg font-semibold text-foreground">1. 수집하는 개인정보 항목</h2>
        <p>
          회원가입 시 이메일, 비밀번호, 닉네임을 수집합니다.
          서비스 이용 과정에서 프로필 정보(소개글, 전문 분야)가 추가로 수집될 수 있습니다.
        </p>

        <h2 className="mt-6 text-lg font-semibold text-foreground">2. 개인정보의 수집 및 이용 목적</h2>
        <p>
          수집된 개인정보는 회원 식별, 서비스 제공, 주문 관리 목적으로만 사용됩니다.
        </p>

        <h2 className="mt-6 text-lg font-semibold text-foreground">3. 개인정보의 보유 및 이용기간</h2>
        <p>
          회원 탈퇴 시 개인정보는 즉시 삭제됩니다.
          단, 관련 법령에 의해 보존이 필요한 경우 해당 기간 동안 보관합니다.
        </p>

        <h2 className="mt-6 text-lg font-semibold text-foreground">4. 개인정보의 제3자 제공</h2>
        <p>
          이용자의 동의 없이 개인정보를 제3자에게 제공하지 않습니다.
        </p>

        <div className="mt-8 rounded-lg border bg-muted/50 p-4 text-center text-sm">
          본 서비스는 프로토타입이며, 실제 법적 효력이 있는 개인정보처리방침이 아닙니다.
        </div>
      </div>
    </div>
  )
}
