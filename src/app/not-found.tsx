import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <h1 className="mb-2 text-6xl font-bold text-muted-foreground">404</h1>
      <p className="mb-8 text-lg text-muted-foreground">
        페이지를 찾을 수 없습니다
      </p>
      <Link
        href="/"
        className="rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90"
      >
        홈으로 돌아가기
      </Link>
    </div>
  )
}
