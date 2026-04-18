'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { fetchAuditById, fetchAuditStatusHistory } from '@/lib/audits/adapter'
import { OpsNav } from '@/components/ui/OpsNav'
import type { AuditRecord, AuditRating } from '@/lib/audits/types'
import type { AuditStatusHistoryEntry } from '@/lib/audits/types'

const RATING_LABEL: Record<AuditRating, string> = { red: 'Needs Work', yellow: 'Partial', green: 'Strong' }
const RATING_COLOR: Record<AuditRating, string> = {
  red: 'bg-red-100 text-red-700',
  yellow: 'bg-yellow-50 text-yellow-700',
  green: 'bg-green-100 text-green-700',
}
const SCORE_AREAS: { key: keyof AuditRecord; label: string }[] = [
  { key: 'score_missed_call',        label: 'Missed Call Process' },
  { key: 'score_lead_response',      label: 'Lead Response Speed' },
  { key: 'score_estimate_followup',  label: 'Estimate Follow-up' },
  { key: 'score_noshow',             label: 'No-Show Recovery' },
  { key: 'score_stale_recovery',     label: 'Stale Lead Recovery' },
  { key: 'score_pipeline_visibility',label: 'Pipeline Visibility' },
]

function RatingBadge({ rating }: { rating: AuditRating | null }) {
  if (!rating) return <span className="text-xs text-gray-400">—</span>
  return <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${RATING_COLOR[rating]}`}>{RATING_LABEL[rating]}</span>
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-4">{title}</h2>
      {children}
    </div>
  )
}

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <p className="text-xs text-gray-400 mb-0.5">{label}</p>
      <p className="text-sm text-gray-900">{value || '—'}</p>
    </div>
  )
}

export default function AuditDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [audit, setAudit] = useState<AuditRecord | null>(null)
  const [history, setHistory] = useState<AuditStatusHistoryEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    Promise.all([fetchAuditById(id), fetchAuditStatusHistory(id)])
      .then(([a, h]) => { setAudit(a); setHistory(h) })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [id])

  return (
    <div className="min-h-screen bg-gray-50">
      <OpsNav title="Audit Detail" subtitle={audit?.business_name ?? 'Loading...'} />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {loading && <div className="py-20 text-center text-sm text-gray-400">Loading...</div>}
        {error && <div className="py-10 text-center text-sm text-red-500">{error}</div>}

        {audit && (
          <>
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">{audit.business_name}</h2>
                <p className="text-sm text-gray-500 mt-1">{audit.industry ?? 'Unknown industry'} · {audit.website ?? 'No website'}</p>
              </div>
              <span className={`text-xs font-medium px-3 py-1 rounded-full capitalize ${
                audit.status === 'won' ? 'bg-green-100 text-green-800' :
                audit.status === 'lost' ? 'bg-red-100 text-red-600' :
                'bg-gray-100 text-gray-600'
              }`}>{audit.status.replace('_', ' ')}</span>
            </div>

            {/* Scoring breakdown */}
            <Section title="Scoring Breakdown">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {SCORE_AREAS.map(a => (
                  <div key={a.key} className="space-y-1">
                    <p className="text-xs text-gray-500">{a.label}</p>
                    <RatingBadge rating={audit[a.key] as AuditRating | null} />
                  </div>
                ))}
              </div>
              {(audit.top_finding_1 || audit.top_finding_2 || audit.top_finding_3) && (
                <div className="mt-5 pt-4 border-t border-gray-100">
                  <p className="text-xs text-gray-400 mb-2">Top Findings</p>
                  <ul className="space-y-1">
                    {[audit.top_finding_1, audit.top_finding_2, audit.top_finding_3].filter(Boolean).map((f, i) => (
                      <li key={i} className="text-sm text-gray-700 flex gap-2"><span className="text-gray-400">#{i + 1}</span>{f}</li>
                    ))}
                  </ul>
                </div>
              )}
              {audit.auditor_notes && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-xs text-gray-400 mb-1">Auditor Notes</p>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{audit.auditor_notes}</p>
                </div>
              )}
              {audit.recommended_package && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-xs text-gray-400 mb-1">Recommended Package</p>
                  <p className="text-sm font-medium text-gray-900 capitalize">{audit.recommended_package.replace('_', ' ')}</p>
                </div>
              )}
            </Section>

            {/* Contact & intake */}
            <Section title="Contact & Intake">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <Field label="Contact" value={audit.contact_name} />
                <Field label="Email" value={audit.email} />
                <Field label="Phone" value={audit.phone} />
                <Field label="Best Contact Method" value={audit.best_contact_method} />
                <Field label="Lead Sources" value={audit.lead_sources} />
                <Field label="Current Lead Flow" value={audit.current_lead_flow} />
                <Field label="Response Speed" value={audit.response_speed} />
                <Field label="Inbound Owner" value={audit.inbound_owner} />
                <Field label="Follow-up Owner" value={audit.follow_up_owner} />
                <Field label="Missed Call Process" value={audit.missed_call_process} />
                <Field label="Post-Estimate Process" value={audit.post_estimate_process} />
                <Field label="No-Show Process" value={audit.no_show_process} />
                <Field label="Avg Response Known" value={audit.avg_response_known} />
                <Field label="Revenue Leaks" value={audit.key_revenue_leaks} />
                <Field label="Customer Value" value={audit.approximate_customer_value} />
              </div>
            </Section>

            {/* Timeline */}
            {history.length > 0 && (
              <Section title="Status Timeline">
                <ol className="relative border-l border-gray-200 space-y-4 ml-2">
                  {history.map(h => (
                    <li key={h.id} className="ml-4">
                      <div className="absolute -left-1.5 mt-1.5 w-3 h-3 rounded-full bg-gray-300 border-2 border-white" />
                      <time className="text-xs text-gray-400 tabular-nums">
                        {new Date(h.changed_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </time>
                      <p className="text-sm text-gray-700 mt-0.5">
                        <span className="text-gray-400">{h.old_status ?? 'created'}</span>
                        <span className="mx-2 text-gray-300">→</span>
                        <span className="font-medium">{h.new_status}</span>
                      </p>
                    </li>
                  ))}
                </ol>
              </Section>
            )}

            <div className="flex gap-3">
              <a href="/ops/audits" className="text-sm text-blue-600 hover:underline">← Back to Audits</a>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
