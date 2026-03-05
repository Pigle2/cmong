'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createClient } from '@/lib/supabase/client'
import { registerSchema, type RegisterFormData } from '@/lib/validations/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function RegisterForm() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      userType: 'BUYER',
    },
  })

  const userType = watch('userType')

  const onSubmit = async (data: RegisterFormData) => {
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          nickname: data.nickname,
          user_type: data.userType,
        },
      },
    })

    if (error) {
      setError(error.message === 'User already registered'
        ? '이미 가입된 이메일입니다'
        : '회원가입에 실패했습니다. 다시 시도해주세요.')
      setLoading(false)
      return
    }

    router.push('/')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="email">이메일</Label>
        <Input
          id="email"
          type="email"
          placeholder="example@email.com"
          {...register('email')}
        />
        {errors.email && (
          <p className="text-sm text-destructive">{errors.email.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="nickname">닉네임</Label>
        <Input
          id="nickname"
          placeholder="닉네임 (2~20자)"
          {...register('nickname')}
        />
        {errors.nickname && (
          <p className="text-sm text-destructive">{errors.nickname.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">비밀번호</Label>
        <Input
          id="password"
          type="password"
          placeholder="영문+숫자+특수문자 8~20자"
          {...register('password')}
        />
        {errors.password && (
          <p className="text-sm text-destructive">{errors.password.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">비밀번호 확인</Label>
        <Input
          id="confirmPassword"
          type="password"
          placeholder="비밀번호를 다시 입력하세요"
          {...register('confirmPassword')}
        />
        {errors.confirmPassword && (
          <p className="text-sm text-destructive">
            {errors.confirmPassword.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label>회원 유형</Label>
        <div className="flex gap-4">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              value="BUYER"
              {...register('userType')}
              className="accent-primary"
            />
            <span className={userType === 'BUYER' ? 'font-medium' : ''}>
              구매자
            </span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              value="SELLER"
              {...register('userType')}
              className="accent-primary"
            />
            <span className={userType === 'SELLER' ? 'font-medium' : ''}>
              판매자
            </span>
          </label>
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? '가입 중...' : '회원가입'}
      </Button>
    </form>
  )
}
