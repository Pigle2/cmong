import Link from 'next/link'

export function Footer() {
  return (
    <footer className="border-t bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="grid gap-8 md:grid-cols-4">
          <div>
            <h3 className="mb-3 text-lg font-bold text-primary">크몽</h3>
            <p className="text-sm text-muted-foreground">
              전문가에게 맡기세요
              <br />
              비즈니스 성공을 위한 전문가 매칭 플랫폼
            </p>
          </div>
          <div>
            <h4 className="mb-3 text-sm font-semibold">서비스</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/services" className="hover:text-foreground">
                  서비스 찾기
                </Link>
              </li>
              <li>
                <Link href="/seller/services/new" className="hover:text-foreground">
                  전문가 등록
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="mb-3 text-sm font-semibold">고객지원</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/faq" className="hover:text-foreground">
                  자주 묻는 질문
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-foreground">
                  이용약관
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-foreground">
                  개인정보처리방침
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="mb-3 text-sm font-semibold">카테고리</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/services?category=design" className="hover:text-foreground">
                  디자인
                </Link>
              </li>
              <li>
                <Link href="/services?category=it-programming" className="hover:text-foreground">
                  IT·프로그래밍
                </Link>
              </li>
              <li>
                <Link href="/services?category=marketing" className="hover:text-foreground">
                  마케팅
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-8 border-t pt-4 text-center text-xs text-muted-foreground">
          &copy; 2024 크몽 Clone. 프로토타입 프로젝트입니다.
        </div>
      </div>
    </footer>
  )
}
