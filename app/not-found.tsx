export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center max-w-sm px-4">
        <p className="text-4xl font-bold text-gray-200 mb-4">404</p>
        <p className="text-sm font-semibold text-gray-900 mb-2">Page not found</p>
        <p className="text-xs text-gray-500 mb-5">The page you are looking for does not exist.</p>
        <a href="/ops" className="text-sm bg-gray-900 text-white rounded-md px-5 py-2 hover:bg-gray-700 transition-colors inline-block">
          Go to Dashboard
        </a>
      </div>
    </div>
  )
}
