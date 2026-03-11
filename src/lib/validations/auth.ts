import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().max(254, '이메일이 너무 깁니다').email('올바른 이메일 주소를 입력해주세요'),
  password: z.string().min(1, '비밀번호를 입력해주세요').max(100, '비밀번호가 너무 깁니다'),
})

export const registerSchema = z.object({
  email: z.string().max(254, '이메일이 너무 깁니다').email('올바른 이메일 주소를 입력해주세요'),
  password: z
    .string()
    .min(8, '비밀번호는 8자 이상이어야 합니다')
    .max(20, '비밀번호는 20자 이하여야 합니다')
    .regex(
      /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/,
      '영문, 숫자, 특수문자를 각각 1개 이상 포함해야 합니다'
    ),
  confirmPassword: z.string(),
  nickname: z
    .string()
    .min(2, '닉네임은 2자 이상이어야 합니다')
    .max(20, '닉네임은 20자 이하여야 합니다')
    .regex(/^[가-힣a-zA-Z0-9]+$/, '한글, 영문, 숫자만 사용 가능합니다'),
  userType: z.enum(['BUYER', 'SELLER']),
}).refine((data) => data.password === data.confirmPassword, {
  message: '비밀번호가 일치하지 않습니다',
  path: ['confirmPassword'],
})

export const forgotPasswordSchema = z.object({
  email: z.string().max(254, '이메일이 너무 깁니다').email('올바른 이메일 주소를 입력해주세요'),
})

export type LoginFormData = z.infer<typeof loginSchema>
export type RegisterFormData = z.infer<typeof registerSchema>
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>
