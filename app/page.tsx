import Link from 'next/link'

const FEATURES = [
  { icon: '⚡', title: 'Instant Lead Capture', desc: 'Every call, form, and inbound request auto-logged in seconds.' },
  { icon: '🤖', title: 'Automated Follow-ups', desc: 'Rules fire within minutes. No lead goes cold on your watch.' },
  { icon: '📊', title: 'Pipeline Visibility', desc: 'See every lead, task, and audit in one clean dashboard.' },
  { icon: '🔔', title: 'Smart Alerts', desc: 'Get notified when deals stall, tasks overdue, or trials expire.' },
  { icon: '👥', title: 'Team Collaboration', desc: 'Invite your team, assign tasks, track who owns what.' },
  { icon: '📈', title: 'Usage Analytics', desc: 'Know exactly how your front office performs month over month.' },
]

const PLANS = [
  { id: 'starter', name: 'Starter', price: '$49', leads: '250', automations: '10', users: '1', cta: 'Start free trial', highlight: false },
  { id: 'growth',  name: 'Growth',  price: '$149', leads: '1,000', automations: '50', users: '5', cta: 'Start free trial', highlight: true },
  { id: 'elite',   name: 'Elite',   price: '$299', leads: 'Unlimited', automations: 'Unlimited', users: 'Unlimited', cta: 'Start free trial', highlight: false },
]

const NICHES = [
  { icon: '🦷', label: 'Dental Practices' },
  { icon: '❄️', label: 'HVAC Companies' },
  { icon: '🌿', label: 'Lawn & Landscape' },
]

const TESTIMONIALS = [
  { quote: "ZenOps paid for itself in the first week. We stopped losing leads to voicemail.", name: 'Marcus T.', role: 'HVAC Owner, Austin TX' },
  { quote: "Our front desk used to miss 30% of follow-ups. Now it's automatic.", name: 'Dr. Lisa K.', role: 'Dental Practice, Denver CO' },
  { quote: "Setup took 20 minutes. First automated follow-up went out that afternoon.", name: 'James R.', role: 'Lawn Care, Tampa FL' },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Nav */}
      <nav className="fixed top-0 inset-x-0 z-50 border-b border-white/5 bg-gray-950/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <span className="text-lg font-bold tracking-tight">ZenOps</span>
          <div className="flex items-center gap-6">
            <a href="#features" className="hidden sm:block text-sm text-gray-400 hover:text-white transition-colors">Features</a>
            <a href="#pricing"  className="hidden sm:block text-sm text-gray-400 hover:text-white transition-colors">Pricing</a>
            <Link href="/auth/signin" className="text-sm text-gray-400 hover:text-white transition-colors">Sign in</Link>
            <Link href="/auth/signup"
              className="text-sm font-medium bg-teal-500 hover:bg-teal-400 text-gray-950 rounded-lg px-4 py-2 transition-colors">
              Start free →
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-40 pb-28 px-4 sm:px-6 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-teal-900/30 via-transparent to-transparent pointer-events-none" />
        <div className="relative max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 text-xs text-gray-400 mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-400 inline-block" />
            14-day free trial · No credit card required
          </div>
          <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-white mb-6 leading-tight">
            Front-office automation<br />
            <span className="text-teal-400">for service businesses that win</span>
          </h1>
          <p className="text-lg text-gray-400 mb-10 max-w-2xl mx-auto">
            Capture every lead, automate follow-ups within minutes, and close more deals —
            without hiring more staff.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/auth/signup"
              className="w-full sm:w-auto text-base font-semibold bg-teal-500 hover:bg-teal-400 text-gray-950 rounded-xl px-8 py-4 transition-colors">
              Start your free trial →
            </Link>
            <a href="#features"
              className="w-full sm:w-auto text-base text-gray-400 hover:text-white border border-white/10 hover:border-white/20 rounded-xl px-8 py-4 transition-colors">
              See how it works
            </a>
          </div>
          <div className="flex items-center justify-center gap-8 mt-12 flex-wrap">
            {NICHES.map(n => (
              <div key={n.label} className="flex items-center gap-2 text-sm text-gray-500">
                <span>{n.icon}</span>{n.label}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social proof bar */}
      <div className="border-y border-white/5 bg-white/[0.02] py-6 px-4">
        <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-center gap-8 text-sm text-gray-500 text-center">
          <span><strong className="text-white text-2xl font-bold block">3 min</strong>avg. lead response</span>
          <span className="hidden sm:block w-px h-8 bg-white/10" />
          <span><strong className="text-white text-2xl font-bold block">40%</strong>more leads converted</span>
          <span className="hidden sm:block w-px h-8 bg-white/10" />
          <span><strong className="text-white text-2xl font-bold block">14 days</strong>free trial</span>
          <span className="hidden sm:block w-px h-8 bg-white/10" />
          <span><strong className="text-white text-2xl font-bold block">20 min</strong>setup time</span>
        </div>
      </div>

      {/* Features */}
      <section id="features" className="py-24 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs font-semibold uppercase tracking-widest text-teal-400 mb-3">Features</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-white">Everything your front office needs</h2>
            <p className="text-gray-400 mt-4 max-w-xl mx-auto">Stop juggling spreadsheets and missed calls. ZenOps puts your entire front office on autopilot.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map(f => (
              <div key={f.title}
                className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-6 hover:bg-white/[0.06] hover:border-white/10 transition-all group">
                <div className="text-3xl mb-4">{f.icon}</div>
                <h3 className="text-base font-semibold text-white mb-2">{f.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 px-4 sm:px-6 bg-white/[0.02]">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-teal-400 mb-3">How it works</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-16">Up and running in 20 minutes</h2>
          <div className="grid sm:grid-cols-3 gap-8">
            {[
              { step: '01', title: 'Sign up', desc: 'Create your account and select your business type. Starter templates load instantly.' },
              { step: '02', title: 'Add your leads', desc: 'Import existing contacts or add your first lead manually. Pipeline view is ready immediately.' },
              { step: '03', title: 'Automation runs', desc: 'Set follow-up rules once. ZenOps handles execution, tracking, and notifications automatically.' },
            ].map(s => (
              <div key={s.step} className="text-center">
                <div className="text-5xl font-black text-white/10 mb-4">{s.step}</div>
                <h3 className="text-base font-semibold text-white mb-2">{s.title}</h3>
                <p className="text-sm text-gray-400">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white">Trusted by service businesses</h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-6">
            {TESTIMONIALS.map(t => (
              <div key={t.name}
                className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-6">
                <p className="text-sm text-gray-300 leading-relaxed mb-5">&ldquo;{t.quote}&rdquo;</p>
                <div>
                  <p className="text-sm font-medium text-white">{t.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 px-4 sm:px-6 bg-white/[0.02]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs font-semibold uppercase tracking-widest text-teal-400 mb-3">Pricing</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-white">Simple, honest pricing</h2>
            <p className="text-gray-400 mt-4">All plans include a 14-day free trial. No credit card required.</p>
          </div>
          <div className="grid sm:grid-cols-3 gap-6">
            {PLANS.map(p => (
              <div key={p.id}
                className={`relative rounded-2xl p-6 border transition-all ${
                  p.highlight
                    ? 'bg-teal-500/10 border-teal-400/40 ring-1 ring-teal-400/30'
                    : 'bg-white/[0.03] border-white/[0.07]'
                }`}>
                {p.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="text-xs font-semibold bg-teal-400 text-gray-950 rounded-full px-3 py-1">Most Popular</span>
                  </div>
                )}
                <p className="text-base font-semibold text-white mb-1">{p.name}</p>
                <p className="text-3xl font-bold text-white mb-1">{p.price}<span className="text-sm font-normal text-gray-400">/mo</span></p>
                <ul className="space-y-2 my-5 text-sm text-gray-400">
                  <li className="flex gap-2"><span className="text-teal-400">✓</span>{p.leads} leads/mo</li>
                  <li className="flex gap-2"><span className="text-teal-400">✓</span>{p.automations} automation runs/mo</li>
                  <li className="flex gap-2"><span className="text-teal-400">✓</span>{p.users} user seat{p.users !== '1' ? 's' : ''}</li>
                  <li className="flex gap-2"><span className="text-teal-400">✓</span>CSV export</li>
                  <li className="flex gap-2"><span className="text-teal-400">✓</span>14-day free trial</li>
                </ul>
                <Link href="/auth/signup"
                  className={`block text-center text-sm font-semibold rounded-xl py-3 transition-colors ${
                    p.highlight
                      ? 'bg-teal-400 text-gray-950 hover:bg-teal-300'
                      : 'bg-white/10 text-white hover:bg-white/20'
                  }`}>
                  {p.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-28 px-4 sm:px-6 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-teal-900/20 via-transparent to-transparent pointer-events-none" />
        <div className="relative max-w-2xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Stop losing leads to slow follow-up</h2>
          <p className="text-gray-400 mb-8">Join service businesses running their front office on ZenOps.</p>
          <Link href="/auth/signup"
            className="inline-block text-base font-semibold bg-teal-500 hover:bg-teal-400 text-gray-950 rounded-xl px-10 py-4 transition-colors">
            Start your 14-day free trial →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-10 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-600">
          <span className="font-bold text-gray-400">ZenOps</span>
          <div className="flex gap-6">
            <a href="#features" className="hover:text-gray-400 transition-colors">Features</a>
            <a href="#pricing"  className="hover:text-gray-400 transition-colors">Pricing</a>
            <Link href="/auth/signin" className="hover:text-gray-400 transition-colors">Sign in</Link>
          </div>
          <span>© {new Date().getFullYear()} ZenOps. All rights reserved.</span>
        </div>
      </footer>
    </div>
  )
}
