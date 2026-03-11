import { cn } from '@/lib/utils'

interface OrderProgressBarProps {
  status: string
}

const STEPS = [
  { key: 'PAID', label: '결제완료' },
  { key: 'ACCEPTED', label: '주문수락' },
  { key: 'IN_PROGRESS', label: '작업중' },
  { key: 'DELIVERED', label: '납품' },
  { key: 'COMPLETED', label: '완료' },
] as const

/**
 * 주어진 status 기준으로 각 step의 상태를 계산합니다.
 * - REVISION_REQUESTED: IN_PROGRESS와 DELIVERED 사이 중간 상태 → IN_PROGRESS까지 완료
 * - CANCELLED / REJECTED / REFUNDED / DISPUTED: 이탈 상태
 */
function getStepIndex(status: string): number {
  switch (status) {
    case 'PAID':              return 0
    case 'ACCEPTED':          return 1
    case 'IN_PROGRESS':       return 2
    case 'REVISION_REQUESTED': return 2  // IN_PROGRESS와 동일 위치
    case 'DELIVERED':         return 3
    case 'COMPLETED':         return 4
    default:                  return -1  // 이탈 상태
  }
}

const CANCELLED_STATUSES = new Set(['CANCELLED', 'REJECTED', 'REFUNDED', 'DISPUTED'])

export function OrderProgressBar({ status }: OrderProgressBarProps) {
  const isCancelled = CANCELLED_STATUSES.has(status)
  const currentIndex = getStepIndex(status)
  const isRevision = status === 'REVISION_REQUESTED'

  if (isCancelled) {
    return (
      <div className="flex items-center gap-2 rounded-lg bg-muted px-4 py-3">
        <span className="text-sm font-medium text-muted-foreground">
          {status === 'CANCELLED' && '취소된 주문입니다'}
          {status === 'REJECTED' && '거절된 주문입니다'}
          {status === 'REFUNDED' && '환불 처리된 주문입니다'}
          {status === 'DISPUTED' && '분쟁 처리 중인 주문입니다'}
        </span>
      </div>
    )
  }

  return (
    <div className="w-full">
      {/* 단계 연결 바 */}
      <div className="relative flex items-center justify-between">
        {STEPS.map((step, index) => {
          const isCompleted = index < currentIndex
          const isActive = index === currentIndex
          const isFuture = index > currentIndex

          return (
            <div
              key={step.key}
              className="flex flex-1 items-center"
            >
              {/* 원 */}
              <div className="relative flex flex-col items-center">
                <div
                  className={cn(
                    'flex h-7 w-7 items-center justify-center rounded-full border-2 transition-colors',
                    isCompleted && 'border-primary bg-primary',
                    isActive && 'border-primary bg-primary',
                    isFuture && 'border-muted-foreground/30 bg-background',
                  )}
                >
                  {isCompleted && (
                    <svg
                      className="h-3.5 w-3.5 text-primary-foreground"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={3}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                  {isActive && (
                    <div
                      className={cn(
                        'h-2.5 w-2.5 rounded-full bg-primary-foreground',
                        isRevision && index === 2 ? 'animate-none' : 'animate-pulse',
                      )}
                    />
                  )}
                  {isFuture && (
                    <div className="h-2 w-2 rounded-full bg-muted-foreground/30" />
                  )}
                </div>

                {/* 수정요청 뱃지 */}
                {isActive && isRevision && (
                  <span className="absolute -top-5 whitespace-nowrap rounded bg-orange-100 px-1 py-0.5 text-[10px] font-medium text-orange-700">
                    수정요청
                  </span>
                )}
              </div>

              {/* 연결선 (마지막 단계 제외) */}
              {index < STEPS.length - 1 && (
                <div className="relative h-0.5 flex-1">
                  <div className="absolute inset-0 bg-muted-foreground/20" />
                  <div
                    className={cn(
                      'absolute inset-0 origin-left transition-transform duration-500',
                      index < currentIndex ? 'bg-primary scale-x-100' : 'bg-primary scale-x-0',
                    )}
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* 단계 레이블 */}
      <div className="mt-2 flex justify-between">
        {STEPS.map((step, index) => {
          const isCompleted = index < currentIndex
          const isActive = index === currentIndex

          return (
            <div
              key={step.key}
              className="flex flex-1 justify-center first:justify-start last:justify-end"
            >
              <span
                className={cn(
                  'text-xs',
                  (isCompleted || isActive) ? 'font-medium text-foreground' : 'text-muted-foreground/60',
                  isActive && 'text-primary',
                )}
              >
                {step.label}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
