import { formatDate } from '@/lib/utils'
import { ORDER_STATUS } from '@/lib/constants'
import { CheckCircle } from 'lucide-react'

interface OrderTimelineProps {
  history: any[]
}

export function OrderTimeline({ history }: OrderTimelineProps) {
  if (history.length === 0) {
    return <p className="text-sm text-muted-foreground">진행 기록이 없습니다</p>
  }

  return (
    <div className="space-y-4">
      {history.map((item, idx) => (
        <div key={item.id} className="flex gap-3">
          <div className="flex flex-col items-center">
            <CheckCircle className="h-5 w-5 shrink-0 text-primary" />
            {idx < history.length - 1 && (
              <div className="mt-1 w-px flex-1 bg-border" />
            )}
          </div>
          <div className="pb-4">
            <p className="text-sm font-medium">
              {ORDER_STATUS[item.to_status as keyof typeof ORDER_STATUS] || item.to_status}
            </p>
            {item.note && (
              <p className="mt-1 text-sm text-muted-foreground">{item.note}</p>
            )}
            <p className="mt-1 text-xs text-muted-foreground">
              {formatDate(item.created_at)} · {item.changed_by_user?.nickname}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}
