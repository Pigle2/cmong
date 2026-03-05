export const APP_NAME = '크몽'
export const APP_DESCRIPTION = '전문가에게 맡기세요 - 비즈니스 성공을 위한 전문가 매칭 플랫폼'

export const ORDER_STATUS = {
  PAID: '결제완료',
  ACCEPTED: '수락됨',
  IN_PROGRESS: '작업중',
  DELIVERED: '납품완료',
  COMPLETED: '구매확정',
  REJECTED: '거절됨',
  CANCELLED: '취소됨',
  REVISION_REQUESTED: '수정요청',
} as const

export const ORDER_STATUS_COLORS: Record<string, string> = {
  PAID: 'bg-blue-100 text-blue-800',
  ACCEPTED: 'bg-indigo-100 text-indigo-800',
  IN_PROGRESS: 'bg-yellow-100 text-yellow-800',
  DELIVERED: 'bg-purple-100 text-purple-800',
  COMPLETED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
  CANCELLED: 'bg-gray-100 text-gray-800',
  REVISION_REQUESTED: 'bg-orange-100 text-orange-800',
}

export const SERVICE_STATUS = {
  DRAFT: '임시저장',
  ACTIVE: '판매중',
  PAUSED: '일시정지',
  DELETED: '삭제됨',
} as const

export const PACKAGE_TIERS = ['STANDARD', 'DELUXE', 'PREMIUM'] as const

export const PACKAGE_TIER_LABELS: Record<string, string> = {
  STANDARD: '스탠다드',
  DELUXE: '디럭스',
  PREMIUM: '프리미엄',
}

export const SELLER_GRADES = {
  NEW: '신규',
  GENERAL: '일반',
  PRO: '전문가',
  MASTER: '마스터',
} as const

export const USER_TYPES = {
  BUYER: '구매자',
  SELLER: '판매자',
} as const

export const ITEMS_PER_PAGE = 20
