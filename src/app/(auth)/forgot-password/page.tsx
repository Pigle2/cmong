'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createClient } from '@/lib/supabase/client'
import {
  forgotPasswordSchema,
  type ForgotPasswordFormData,
} from '@/lib/validations/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  })

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setLoading(true)
    const supabase = createClient()
    await supabase.auth.resetPasswordForEmail(data.email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    setSent(true)
    setLoading(false)
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">비밀번호 찾기</CardTitle>
        <CardDescription>
          가입한 이메일로 재설정 링크를 보내드립니다
        </CardDescription>
      </CardHeader>
      <CardContent>
        {sent ? (
          <div className="rounded-md bg-green-50 p-4 text-center text-sm text-green-700">
            비밀번호 재설정 링크를 이메일로 발송했습니다.
            <br />
            이메일을 확인해주세요.
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">이메일</Label>
              <Input
                id="email"
                type="email"
                placeholder="example@email.com"
                {...register('email')}
              />
              {errors.email && (
                <p className="text-sm text-destructive">
                  {errors.email.message}
                </p>
              )}
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? '발송 중...' : '재설정 링크 발송'}
            </Button>
          </form>
        )}
      </CardContent>
      <CardFooter className="justify-center text-sm">
        <Link href="/login" className="text-muted-foreground hover:text-primary">
          로그인으로 돌아가기
        </Link>
      </CardFooter>
    </Card>
  )
}
