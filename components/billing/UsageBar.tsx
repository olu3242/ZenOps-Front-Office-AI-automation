import { usageColor } from '@/lib/billing/gates'

export function UsageBar({
  label, current, limit, pct,
}: {
  label: string
  current: number
  limit: number | null
  pct: number | null
}) {
  const displayPct = pct ?? 0
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-gray-600">{label}</span>
        <span className="text-xs text-gray-500 tabular-nums">
          {current.toLocaleString()} / {limit === null ? '∞' : limit.toLocaleString()}
        </span>
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${usageColor(pct)}`}
          style={{ width: `${Math.min(displayPct, 100)}%` }}
        />
      </div>
      {pct !== null && pct >= 80 && (
        <p className="text-xs text-orange-600 mt-0.5">{pct >= 100 ? 'Limit reached' : `${pct}% used`}</p>
      )}
    </div>
  )
}
