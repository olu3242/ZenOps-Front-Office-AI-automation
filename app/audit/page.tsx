import Link from 'next/link'

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------
const PAINS = [
  { icon: '📵', text: 'Missed calls with no callback system' },
  { icon: '📋', text: 'Estimates sent — then total silence' },
  { icon: '🕳️', text: 'Leads falling through the cracks daily' },
  { icon: '🙅', text: 'No-shows with zero recovery process' },
  { icon: '🌫️', text: "No idea which jobs are still open or lost" },
]

const AREAS = [
  {
    title:  'Missed Call Process',
    detail: 'How fast are you calling back? Does anything happen automatically?',
  },
  {
    title:  'Lead Response Speed',
    detail: 'First response time is the #1 predictor of whether you win the job.',
  },
  {
    title:  'Estimate Follow-Up',
    detail: 'What happens after you send a quote? Most contractors: nothing.',
  },
  {
    title:  'No-Show Recovery',
    detail: 'A structured same-day re-engagement call converts 20–40% of no-shows.',
  },
  {
    title:  'Stale Lead Revival',
    detail: 'Leads 7–30 days old are still winnable. Almost nobody works them.',
  },
  {
    title:  'Pipeline Visibility',
    detail: 'Can you see exactly where every open lead stands right now?',
  },
]

const WHAT_YOU_GET = [
  'A scored report — Red / Yellow / Green on all 6 front office areas',
  'Your top 3 revenue leaks, ranked by impact',
  'A specific recommended fix for each problem area',
  'An honest assessment of whether we can help you',
  'Zero pressure — no sales pitch on the call',
]

const STEPS = [
  {
    n:    '1',
    title: 'Submit your intake form',
    body:  'Takes about 2 minutes. Tells us how your front office works today.',
  },
  {
    n:    '2',
    title: 'Attend your 20-min audit call',
    body:  "We ask questions, listen, and map your biggest leaks. You don't need to prep anything.",
  },
  {
    n:    '3',
    title: 'Get your scored report',
    body:  'We send you the written breakdown with scores and a clear starting point.',
  },
]

const WHO_FOR = [
  'Service businesses with 2–20 employees',
  'Owners still handling most of their own leads',
  '$300k–$3M in annual revenue',
  'Feeling like you\'re losing jobs you should be winning',
  'Willing to look honestly at how your front office actually works',
]

const FAQS = [
  {
    q: 'Is this actually free?',
    a: 'Yes. No credit card, no hidden upsell on the call. We do this to demonstrate our value before asking for anything.',
  },
  {
    q: 'How long does it take?',
    a: "The intake form takes 2–3 minutes. The audit call is 20 minutes. That's it.",
  },
  {
    q: 'What do I need to prepare?',
    a: "Nothing. Just show up and be honest about how things currently work. The messier the truth, the better the audit.",
  },
  {
    q: 'What happens after the audit?',
    a: "You get a written scorecard with your top leaks and a recommended fix. If we think we can help, we'll say so — but there's no pressure.",
  },
  {
    q: 'Who runs the audit call?',
    a: 'A ZenOps strategist. Not a junior SDR. Someone who has seen hundreds of service business front offices.',
  },
]

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function AuditLandingPage() {
  return (
    <div className="min-h-screen bg-white text-gray-900">

      {/* ── Nav ── */}
      <nav className="border-b border-gray-100 bg-white/90 backdrop-blur sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-5 py-3 flex items-center justify-between">
          <span className="font-semibold text-gray-900 text-sm">ZenOps</span>
          <Link
            href="/audit/request"
            className="text-sm bg-gray-900 text-white rounded-md px-4 py-1.5 font-medium hover:bg-gray-700 transition-colors"
          >
            Book Free Audit
          </Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="max-w-3xl mx-auto px-5 pt-20 pb-16 text-center">
        <span className="inline-block text-xs font-semibold tracking-widest text-gray-400 uppercase mb-4">
          Free · 20 Minutes · No Strings
        </span>
        <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 leading-tight mb-5">
          Is Your Front Office<br className="hidden sm:block" /> Leaking Revenue?
        </h1>
        <p className="text-lg text-gray-500 max-w-xl mx-auto mb-8">
          In one 20-minute call we'll identify exactly where leads are falling
          through the cracks — and what to fix first. No fluff. No pitch.
        </p>
        <Link
          href="/audit/request"
          className="inline-block bg-gray-900 text-white text-base font-semibold rounded-lg px-8 py-3.5 hover:bg-gray-700 transition-colors shadow-sm"
        >
          Request My Free Audit →
        </Link>
        <p className="mt-4 text-xs text-gray-400">
          Typically delivered within 1 business day of your call
        </p>
      </section>

      {/* ── Pain strip ── */}
      <section className="bg-gray-50 border-y border-gray-100 py-10">
        <div className="max-w-4xl mx-auto px-5">
          <p className="text-center text-xs font-semibold uppercase tracking-widest text-gray-400 mb-7">
            Sound familiar?
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
            {PAINS.map((p) => (
              <div key={p.text} className="text-center">
                <div className="text-2xl mb-2">{p.icon}</div>
                <p className="text-sm text-gray-600 leading-snug">{p.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── What is an audit ── */}
      <section className="max-w-4xl mx-auto px-5 py-16 grid sm:grid-cols-2 gap-12 items-center">
        <div>
          <h2 className="text-2xl font-bold mb-4">What is a Front Office Audit?</h2>
          <p className="text-gray-600 leading-relaxed mb-4">
            It's a structured 20-minute call where we review exactly how leads
            come into your business, how fast you respond, and where revenue is
            being silently lost before a job is ever booked.
          </p>
          <p className="text-gray-600 leading-relaxed">
            Most service businesses lose 30–50% of potential jobs not because
            their pricing is wrong — but because their front office process has
            gaps that nobody is fixing. This audit finds those gaps.
          </p>
        </div>
        <div className="bg-gray-50 rounded-xl p-6 border border-gray-100">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-4">
            What we review
          </p>
          <ul className="space-y-2.5">
            {AREAS.map((a) => (
              <li key={a.title} className="flex items-start gap-2.5 text-sm text-gray-700">
                <span className="mt-0.5 text-teal-600 shrink-0">✓</span>
                <span>{a.title}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── 6-area diagnostic grid ── */}
      <section className="bg-gray-50 border-y border-gray-100 py-16">
        <div className="max-w-4xl mx-auto px-5">
          <h2 className="text-2xl font-bold text-center mb-2">The 6 Audit Areas</h2>
          <p className="text-center text-gray-500 mb-10 text-sm">
            Each area is scored Red / Yellow / Green based on your answers and our analysis.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {AREAS.map((a, i) => (
              <div key={a.title} className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="flex items-center gap-3 mb-3">
                  <span className="w-7 h-7 rounded-full bg-gray-900 text-white text-xs font-bold flex items-center justify-center shrink-0">
                    {i + 1}
                  </span>
                  <h3 className="font-semibold text-sm text-gray-900">{a.title}</h3>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed">{a.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── What you get ── */}
      <section className="max-w-3xl mx-auto px-5 py-16 text-center">
        <h2 className="text-2xl font-bold mb-2">What You Walk Away With</h2>
        <p className="text-gray-500 mb-10 text-sm">
          A concrete deliverable — not a vague conversation.
        </p>
        <ul className="text-left inline-block space-y-3">
          {WHAT_YOU_GET.map((item) => (
            <li key={item} className="flex items-start gap-3 text-sm text-gray-700">
              <span className="mt-0.5 text-teal-600 font-bold shrink-0">✓</span>
              {item}
            </li>
          ))}
        </ul>
      </section>

      {/* ── Process ── */}
      <section className="bg-gray-900 py-16">
        <div className="max-w-4xl mx-auto px-5">
          <h2 className="text-2xl font-bold text-white text-center mb-10">How It Works</h2>
          <div className="grid sm:grid-cols-3 gap-8">
            {STEPS.map((s) => (
              <div key={s.n} className="text-center">
                <div className="w-10 h-10 rounded-full border-2 border-gray-600 text-gray-300 font-bold text-lg flex items-center justify-center mx-auto mb-4">
                  {s.n}
                </div>
                <h3 className="font-semibold text-white mb-2 text-sm">{s.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{s.body}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-12">
            <Link
              href="/audit/request"
              className="inline-block bg-white text-gray-900 text-sm font-semibold rounded-lg px-8 py-3 hover:bg-gray-100 transition-colors"
            >
              Request My Free Audit →
            </Link>
          </div>
        </div>
      </section>

      {/* ── Who this is for ── */}
      <section className="max-w-3xl mx-auto px-5 py-16">
        <div className="grid sm:grid-cols-2 gap-10 items-start">
          <div>
            <h2 className="text-2xl font-bold mb-4">This is for you if…</h2>
            <ul className="space-y-3">
              {WHO_FOR.map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-sm text-gray-700">
                  <span className="mt-0.5 text-teal-600 shrink-0">→</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-amber-50 border border-amber-100 rounded-xl p-6">
            <p className="text-xs font-semibold uppercase tracking-widest text-amber-600 mb-3">
              Not a fit if…
            </p>
            <ul className="space-y-2.5">
              {[
                "You have a dedicated full-time sales team",
                "You're not willing to change how things work",
                "You're looking for a quick-fix without process change",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm text-amber-800">
                  <span className="mt-0.5 shrink-0">✕</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ── Mid-page CTA ── */}
      <section className="bg-teal-700 py-14">
        <div className="max-w-2xl mx-auto px-5 text-center">
          <h2 className="text-2xl font-bold text-white mb-3">
            Ready to see where the leaks are?
          </h2>
          <p className="text-teal-200 mb-7 text-sm">
            Takes 2 minutes to request. We'll confirm within one business day.
          </p>
          <Link
            href="/audit/request"
            className="inline-block bg-white text-teal-800 text-sm font-semibold rounded-lg px-8 py-3 hover:bg-teal-50 transition-colors"
          >
            Request My Free Audit →
          </Link>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="max-w-2xl mx-auto px-5 py-16">
        <h2 className="text-2xl font-bold text-center mb-10">Common Questions</h2>
        <div className="space-y-5">
          {FAQS.map((f) => (
            <div key={f.q} className="border-b border-gray-100 pb-5">
              <h3 className="font-semibold text-gray-900 mb-1.5 text-sm">{f.q}</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{f.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Footer CTA ── */}
      <section className="border-t border-gray-100 bg-gray-50 py-14">
        <div className="max-w-xl mx-auto px-5 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">
            Last chance
          </p>
          <h2 className="text-2xl font-bold mb-4">
            Stop losing jobs you should be winning.
          </h2>
          <Link
            href="/audit/request"
            className="inline-block bg-gray-900 text-white text-sm font-semibold rounded-lg px-8 py-3 hover:bg-gray-700 transition-colors"
          >
            Book My Free 20-Minute Audit →
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-gray-100 py-6 text-center">
        <p className="text-xs text-gray-400">© {new Date().getFullYear()} ZenOps · Front Office Automation</p>
      </footer>

    </div>
  )
}
