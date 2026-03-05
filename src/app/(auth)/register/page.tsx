import Link from 'next/link'
import { RegisterForm } from '@/components/features/auth/register-form'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export default function RegisterPage() {
  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">회원가입</CardTitle>
        <CardDescription>크몽에 오신 것을 환영합니다</CardDescription>
      </CardHeader>
      <CardContent>
        <RegisterForm />
      </CardContent>
      <CardFooter className="justify-center text-sm text-muted-foreground">
        이미 회원이신가요?{' '}
        <Link href="/login" className="ml-1 font-medium text-primary hover:underline">
          로그인
        </Link>
      </CardFooter>
    </Card>
  )
}
