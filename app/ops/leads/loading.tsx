import { TableSkeleton } from '@/components/ui/TableSkeleton'

export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 h-14 animate-pulse" />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <TableSkeleton />
      </div>
    </div>
  )
}
