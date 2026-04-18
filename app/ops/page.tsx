'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

interface Counts {
  leads:    Record<string, number>
  tasks:    Record<string, number>
  audits:   Record<string, number>
  outreach: Record<string, number>
  overdueTaskCount: number
}

const today = new Date().toISOString().split('T')[0]

async function fetchCounts(): Promise<Counts> {
  const [leads, tasks, audits, outreach, overdue] = await Promise.all([
    supabase.from('leads').select('status'),
    supabase.from('tasks').select('status'),
    supabase.from('front_office_audits').select('status'),
    supabase.from('outreach_records').select('status'),
    supabase.from('tasks').select('id', { count: 'exact', head: true })
      .neq('status', 'done').lt('due_date', today),
  ])

  const count = (rows: { status: string }[] | null) =>
    (rows ?? []).reduce<Record<string, number>>((acc, r) => {
      acc[r.status] = (acc[r.status] ?? 0) + 1
      return acc
    }, {})

  return {
    leads:    count(leads.data),
    tasks:    count(tasks.data),
    audits:   count(audits.data),
    outreach: count(outreach.data),
    overdueTaskCount: overdue.count ?? 0,
  }
}

function StatCard({ label, value, sub, href, color = 'gray' }: {
  label: string; value: number; sub?: string; href: string
  color?: 'gray' | 'teal' | 'blue' | 'purple' | 'red' | 'orange'
}) {
  const ring: Record<string, string> = {
    gray:   'border-gray-200',
    teal:   'border-teal-200',
    blue:   'border-blue-200',
    purple: 'border-purple-200',
    red:    'border-red-200',
    orange: 'border-orange-200',
  }
  const num: Record<string, string> = {
    gray:   'text-gray-900',
    teal:   'text-teal-700',
    blue:   'text-blue-700',
    purple: 'text-purple-700',
    red:    'text-red-600',
    orange: 'text-orange-600',
  }
  return (
    <a href={href} className={`bg-white border ${ring[color]} rounded-xl p-5 hover:shadow-sm transition-shadow block`}>
      <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-2">{label}</p>
      <p className={`text-3xl font-bold ${num[color]}`}>{value}</p>
      {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
    </a>
  )
}

function PipelineBar({ label, buckets, href }: {
  label: string
  buckets: { name: string; count: number; color: string }[]
  href: string
}) {
  const total = buckets.reduce((s, b) => s + b.count, 0)
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">{label}</p>
        <a href={href} className="text-xs text-blue-600 hover:underline">View all</a>
      </div>
      <div className="flex gap-1 h-2 rounded-full overflow-hidden mb-3">
        {total === 0
          ? <div className="flex-1 bg-gray-100 rounded-full" />
          : buckets.filter(b => b.count > 0).map(b => (
            <div key={b.name} className={`${b.color} rounded-full`} style={{ flex: b.count }} />
          ))
        }
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        {buckets.map(b => (
          <span key={b.name} className="text-xs text-gray-600">
            <span className="font-medium">{b.count}</span> {b.name}
          </span>
        ))}
      </div>
    </div>
  )
}

export default function OpsDashboard() {
  const router = useRouter()
  const [counts, setCounts] = useState<Counts | null>(null)
  const [loading, setLoading] = useState(true)
  const [signingOut, setSigningOut] = useState(false)

  useEffect(() => {
    fetchCounts().then(c => { setCounts(c); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  async function handleSignOut() {
    setSigningOut(true)
    await supabase.auth.signOut()
    router.push('/auth/signin')
  }

  const c = counts

  const auditTotal   = c ? Object.values(c.audits).reduce((s, n) => s + n, 0) : 0
  const leadTotal    = c ? Object.values(c.leads).reduce((s, n) => s + n, 0) : 0
  const taskOpen     = c ? (c.tasks.todo ?? 0) + (c.tasks.in_progress ?? 0) + (c.tasks.blocked ?? 0) : 0
  const outreachWon  = c?.outreach.won ?? 0
  const outreachTotal = c ? Object.values(c.outreach).reduce((s, n) => s + n, 0) : 0

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-gray-900">ZenOps Dashboard</h1>
            <p className="text-sm text-gray-500 mt-0.5">Front Office overview</p>
          </div>
          <div className="flex items-center gap-4">
            <a href="/ops/outreach"  className="text-sm text-blue-600 hover:underline">Outreach</a>
            <a href="/ops/audits"    className="text-sm text-blue-600 hover:underline">Audits</a>
            <a href="/ops/leads"     className="text-sm text-blue-600 hover:underline">Leads</a>
            <a href="/ops/tasks"     className="text-sm text-blue-600 hover:underline">Tasks</a>
            <a href="/automation"    className="text-sm text-blue-600 hover:underline">Automation</a>
            <button onClick={handleSignOut} disabled={signingOut}
              className="text-sm text-gray-400 hover:text-gray-600 disabled:opacity-50 transition-colors">
              {signingOut ? 'Signing out...' : 'Sign out'}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {loading ? (
          <div className="py-20 text-center text-sm text-gray-400">Loading...</div>
        ) : (
          <>
            {/* KPI row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <StatCard label="Outreach prospects" value={outreachTotal} sub={`${outreachWon} won`} href="/ops/outreach" color="blue" />
              <StatCard label="Audits total" value={auditTotal}
                sub={`${c?.audits.submitted ?? 0} pending`} href="/ops/audits" color="purple" />
              <StatCard label="Open leads" value={leadTotal}
                sub={`${c?.leads.qualified ?? 0} qualified`} href="/ops/leads" color="teal" />
              <StatCard label="Open tasks" value={taskOpen}
                sub={c && c.overdueTaskCount > 0 ? `${c.overdueTaskCount} overdue` : 'none overdue'}
                href="/ops/tasks"
                color={c && c.overdueTaskCount > 0 ? 'red' : 'gray'} />
            </div>

            {/* Pipeline bars */}
            <div className="grid sm:grid-cols-2 gap-4">
              <PipelineBar
                label="Outreach pipeline"
                href="/ops/outreach"
                buckets={[
                  { name: 'New',          count: (c?.outreach.lead_identified ?? 0) + (c?.outreach.research_complete ?? 0), color: 'bg-gray-300' },
                  { name: 'Contacted',    count: (c?.outreach.outreach_sent ?? 0) + (c?.outreach.follow_up_1 ?? 0) + (c?.outreach.follow_up_2 ?? 0) + (c?.outreach.follow_up_3 ?? 0), color: 'bg-blue-400' },
                  { name: 'Engaged',      count: (c?.outreach.conversation_started ?? 0) + (c?.outreach.audit_offered ?? 0), color: 'bg-indigo-400' },
                  { name: 'Audit',        count: (c?.outreach.audit_booked ?? 0) + (c?.outreach.audit_completed ?? 0), color: 'bg-purple-400' },
                  { name: 'Proposal',     count: (c?.outreach.proposal_sent ?? 0) + (c?.outreach.negotiation ?? 0), color: 'bg-amber-400' },
                  { name: 'Won',          count: c?.outreach.won ?? 0, color: 'bg-teal-500' },
                  { name: 'Lost',         count: c?.outreach.lost ?? 0, color: 'bg-red-300' },
                ]}
              />
              <PipelineBar
                label="Audit pipeline"
                href="/ops/audits"
                buckets={[
                  { name: 'Submitted',  count: c?.audits.submitted ?? 0,      color: 'bg-blue-400' },
                  { name: 'Scheduled',  count: c?.audits.scheduled ?? 0,      color: 'bg-purple-400' },
                  { name: 'Completed',  count: c?.audits.completed ?? 0,      color: 'bg-teal-400' },
                  { name: 'No Show',    count: c?.audits.no_show ?? 0,        color: 'bg-orange-300' },
                  { name: 'Proposal',   count: c?.audits.proposal_sent ?? 0,  color: 'bg-cyan-400' },
                  { name: 'Won',        count: c?.audits.won ?? 0,            color: 'bg-green-500' },
                  { name: 'Lost',       count: c?.audits.lost ?? 0,           color: 'bg-red-300' },
                  { name: 'Not a Fit',  count: c?.audits.not_a_fit ?? 0,      color: 'bg-gray-300' },
                ]}
              />
              <PipelineBar
                label="Lead pipeline"
                href="/ops/leads"
                buckets={[
                  { name: 'New',       count: c?.leads.new ?? 0,       color: 'bg-gray-300' },
                  { name: 'Contacted', count: c?.leads.contacted ?? 0, color: 'bg-blue-400' },
                  { name: 'Qualified', count: c?.leads.qualified ?? 0, color: 'bg-purple-400' },
                  { name: 'Converted', count: c?.leads.converted ?? 0, color: 'bg-teal-500' },
                  { name: 'Lost',      count: c?.leads.lost ?? 0,      color: 'bg-red-300' },
                ]}
              />
              <PipelineBar
                label="Task status"
                href="/ops/tasks"
                buckets={[
                  { name: 'To Do',       count: c?.tasks.todo ?? 0,        color: 'bg-gray-300' },
                  { name: 'In Progress', count: c?.tasks.in_progress ?? 0, color: 'bg-blue-400' },
                  { name: 'Blocked',     count: c?.tasks.blocked ?? 0,     color: 'bg-orange-400' },
                  { name: 'Done',        count: c?.tasks.done ?? 0,        color: 'bg-teal-500' },
                ]}
              />
            </div>

            {/* Quick links */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'View Outreach',   href: '/ops/outreach' },
                { label: 'View Audits',     href: '/ops/audits' },
                { label: 'View Leads',      href: '/ops/leads' },
                { label: 'Automation Rules', href: '/automation' },
              ].map(({ label, href }) => (
                <a key={href} href={href}
                  className="text-center text-sm text-gray-600 bg-white border border-gray-200 rounded-lg px-4 py-3 hover:border-gray-300 hover:shadow-sm transition-all">
                  {label} →
                </a>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
