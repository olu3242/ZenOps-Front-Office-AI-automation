import Link from 'next/link'

const CALENDLY_URL = process.env.NEXT_PUBLIC_CALENDLY_URL ?? ''

export default function AuditBookPage() {
  return (
    <div className="min-h-screen bg-white text-gray-900">

      {/* Nav */}
      <nav className="border-b border-gray-100 bg-white/90 backdrop-blur sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-5 py-3 flex items-center justify-between">
          <Link href="/audit" className="font-semibold text-gray-900 text-sm">ZenOps</Link>
          <span className="text-xs text-gray-400">Free · 20 Minutes · No Strings</span>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-2xl mx-auto px-5 pt-14 pb-6 text-center">
        <span className="inline-block text-xs font-semibold tracking-widest text-gray-400 uppercase mb-3">
          Step 2 of 2
        </span>
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
          Schedule Your Audit Call
        </h1>
        <p className="text-gray-500 text-sm max-w-md mx-auto">
          Pick a 20-minute slot that works for you. We'll review your intake form
          beforehand so the call starts focused.
        </p>
      </section>

      {/* Calendar embed */}
      <section className="max-w-3xl mx-auto px-5 pb-14">
        {CALENDLY_URL ? (
          <iframe
            src={CALENDLY_URL}
            width="100%"
            height="700"
            frameBorder="0"
            title="Schedule Audit Call"
            className="rounded-xl border border-gray-100 shadow-sm"
          />
        ) : (
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-10 text-center">
            <p className="text-gray-700 font-medium mb-2">Scheduling link coming soon</p>
            <p className="text-sm text-gray-500 mb-6">
              We'll reach out within 1 business day to confirm your call time.
            </p>
            <a
              href="mailto:hello@zenops.co"
              className="inline-block bg-gray-900 text-white text-sm font-semibold rounded-lg px-6 py-2.5 hover:bg-gray-700 transition-colors"
            >
              Email us to schedule →
            </a>
          </div>
        )}
      </section>

      {/* Reassurance strip */}
      <section className="border-t border-gray-100 bg-gray-50 py-8">
        <div className="max-w-2xl mx-auto px-5 grid sm:grid-cols-3 gap-6 text-center">
          {[
            ['20 min', 'Focused, no fluff'],
            ['Free', 'No credit card, no pitch'],
            ['Same day report', 'Written scorecard delivered fast'],
          ].map(([title, sub]) => (
            <div key={title}>
              <p className="font-semibold text-gray-900 text-sm">{title}</p>
              <p className="text-xs text-gray-500 mt-0.5">{sub}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-6 text-center">
        <p className="text-xs text-gray-400">© {new Date().getFullYear()} ZenOps · Front Office Automation</p>
      </footer>

    </div>
  )
}
