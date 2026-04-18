import { TableSkeleton } from '@/components/ui/TableSkeleton'
export default function SettingsLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 h-16 animate-pulse" />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8"><TableSkeleton cols={2} rows={4} /></div>
    </div>
  )
}
