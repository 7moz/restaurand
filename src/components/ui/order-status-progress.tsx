import type { OrderStatus } from '../../types/dashboard'

const STATUS_STEPS: OrderStatus[] = ['PENDING', 'ACCEPTED', 'PREPARING', 'READY_FOR_PICKUP', 'COMPLETED']

function getProgressPercent(status: OrderStatus) {
  const index = STATUS_STEPS.indexOf(status)
  if (index < 0) {
    return 0
  }
  return (index / (STATUS_STEPS.length - 1)) * 100
}

export function OrderStatusProgress({ status }: { status: OrderStatus }) {
  const progress = getProgressPercent(status)

  return (
    <div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all duration-300"
          style={{ width: `${progress}%` }}
          aria-hidden
        />
      </div>
    </div>
  )
}
