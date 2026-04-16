export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-semibold text-gray-900">ZenOps</h1>
        <p className="mt-2 text-gray-500">Front Office</p>
        <div className="mt-6 flex gap-4 justify-center">
          <a href="/ops/outreach" className="text-sm text-blue-600 hover:underline">Outreach Tracker →</a>
          <a href="/ops/audits" className="text-sm text-blue-600 hover:underline">Audits →</a>
        </div>
      </div>
    </main>
  )
}
