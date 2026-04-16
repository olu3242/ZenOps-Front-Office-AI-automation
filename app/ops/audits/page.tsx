export default function AuditsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-gray-900">Audits</h1>
            <p className="text-sm text-gray-500 mt-0.5">Front Office Audit pipeline</p>
          </div>
          <a href="/ops/outreach" className="text-sm text-blue-600 hover:underline">
            ← Outreach
          </a>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 text-center">
        <p className="text-sm text-gray-400">Audit records will appear here.</p>
      </div>
    </div>
  )
}
