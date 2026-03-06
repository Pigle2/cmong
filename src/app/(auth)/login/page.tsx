import { Suspense } from 'react'
import Link from 'next/link'
import { LoginForm } from '@/components/features/auth/login-form'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export default function LoginPage() {
  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">로그인</CardTitle>
        <CardDescription>이메일로 로그인하세요</CardDescription>
      </CardHeader>
      <CardContent>
        <Suspense>
          <LoginForm />
        </Suspense>
      </CardContent>
      <CardFooter className="flex flex-col gap-2 text-center text-sm">
        <Link
          href="/forgot-password"
          className="text-muted-foreground hover:text-primary"
        >
          비밀번호를 잊으셨나요?
        </Link>
        <div className="text-muted-foreground">
          아직 회원이 아니신가요?{' '}
          <Link href="/register" className="font-medium text-primary hover:underline">
            회원가입
          </Link>
        </div>
      </CardFooter>
    </Card>
  )
}
