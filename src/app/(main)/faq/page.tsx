import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const faqs = [
  {
    question: '서비스는 어떻게 주문하나요?',
    answer: '원하는 서비스를 찾아 패키지를 선택한 후 결제하면 주문이 완료됩니다. 판매자가 주문을 확인하면 작업이 시작됩니다.',
  },
  {
    question: '결제 수단은 무엇이 있나요?',
    answer: '현재 프로토타입 단계로, 실제 결제 기능은 추후 지원 예정입니다.',
  },
  {
    question: '주문 취소는 어떻게 하나요?',
    answer: '주문 상세 페이지에서 취소 요청을 할 수 있습니다. 작업 시작 전에는 즉시 취소가 가능합니다.',
  },
  {
    question: '판매자로 등록하려면 어떻게 하나요?',
    answer: '로그인 후 "전문가 등록" 메뉴에서 서비스를 등록하면 판매자로 활동할 수 있습니다.',
  },
  {
    question: '리뷰는 언제 작성할 수 있나요?',
    answer: '주문이 완료된 후 리뷰를 작성할 수 있습니다. 주문 상세 페이지에서 리뷰 작성 버튼을 확인하세요.',
  },
]

export default function FAQPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">자주 묻는 질문</h1>
      <div className="space-y-4">
        {faqs.map((faq, i) => (
          <Card key={i}>
            <CardHeader>
              <CardTitle className="text-base">{faq.question}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{faq.answer}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
