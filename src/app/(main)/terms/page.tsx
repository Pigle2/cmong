export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">이용약관</h1>
      <div className="prose prose-sm max-w-none text-muted-foreground">
        <h2 className="text-lg font-semibold text-foreground">제1조 (목적)</h2>
        <p>
          이 약관은 크몽 클론 프로토타입(이하 &quot;서비스&quot;)의 이용과 관련하여 서비스와
          이용자 간의 권리, 의무 및 기타 필요한 사항을 규정함을 목적으로 합니다.
        </p>

        <h2 className="mt-6 text-lg font-semibold text-foreground">제2조 (정의)</h2>
        <p>
          본 서비스는 프로토타입 프로젝트로, 실제 상거래가 이루어지지 않습니다.
          모든 결제 및 정산 기능은 시뮬레이션입니다.
        </p>

        <h2 className="mt-6 text-lg font-semibold text-foreground">제3조 (서비스 이용)</h2>
        <p>
          서비스는 만 14세 이상의 개인 또는 법인이 이용할 수 있으며,
          회원가입 시 정확한 정보를 입력해야 합니다.
        </p>

        <div className="mt-8 rounded-lg border bg-muted/50 p-4 text-center text-sm">
          본 서비스는 프로토타입이며, 실제 법적 효력이 있는 약관이 아닙니다.
        </div>
      </div>
    </div>
  )
}
