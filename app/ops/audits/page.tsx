'use client'

import { useEffect, useCallback, useState, Fragment } from 'react'
import { useRouter } from 'next/navigation'
import { fetchAuditRecords, updateAuditStatus, updateAuditResults, type AuditResultsPayload } from '@/lib/audits/adapter'
import { supabase } from '@/lib/supabase'
import { useOptimisticStatus } from '@/hooks/useOptimisticStatus'
import { useToast } from '@/hooks/useToast'
import { ToastContainer } from '@/components/ui/Toast'
import type { AuditRecord, AuditRating, AuditPackage, AuditStatus } from '@/lib/audits/types'

const ALL_STATUSES: AuditStatus[] = [
  'submitted', 'scheduled', 'completed', 'no_show',
  'proposal_sent', 'won', 'lost', 'not_a_fit',
]

const STATUS_LABELS: Record<AuditStatus, string> = {
  submitted:      'Submitted',
  scheduled:      'Scheduled',
  completed:      'Completed',
  no_show:        'No Show',
  proposal_sent:  'Proposal Sent',
  won:            'Won',
  lost:           'Lost',
  not_a_fit:      'Not a Fit',
}

const STATUS_COLORS: Record<AuditStatus, string> = {
  submitted:      'bg-blue-50 text-blue-700',
  scheduled:      'bg-purple-50 text-purple-700',
  completed:      'bg-teal-50 text-teal-700',
  no_show:        'bg-orange-50 text-orange-700',
  proposal_sent:  'bg-cyan-50 text-cyan-700',
  won:            'bg-green-100 text-green-800',
  lost:           'bg-red-50 text-red-600',
  not_a_fit:      'bg-gray-100 text-gray-500',
}

const RATING_COLORS: Record<string, string> = {
  red:    'bg-red-100 text-red-700',
  yellow: 'bg-yellow-50 text-yellow-700',
  green:  'bg-green-100 text-green-700',
}

export default function AuditsPage() {
  const router = useRouter()
  const { toasts, addToast, dismiss } = useToast()
  const { records, setRecords, savingIds, updateStatus } = useOptimisticStatus<AuditRecord>([])

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [signingOut, setSigningOut] = useState(false)
  const [signOutError, setSignOutError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setRecords(await fetchAuditRecords())
    } catch {
      setError('Failed to load audit records. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [setRecords])

  useEffect(() => { load() }, [load])

  const handleSignOut = useCallback(async () => {
    setSigningOut(true)
    setSignOutError(null)
    const { error } = await supabase.auth.signOut()
    if (error) {
      setSignOutError('Sign-out failed. Try again.')
      setSigningOut(false)
      return
    }
    router.push('/auth/signin')
  }, [router])

  const handleStatusChange = useCallback(async (
    record: AuditRecord,
    newStatus: AuditStatus,
  ) => {
    if (newStatus === record.status) return

    await updateStatus({
      id: record.id,
      optimistic: { status: newStatus },
      apiCall: () => updateAuditStatus(record.id, newStatus, record.updated_at),
      onSuccess:  () => addToast('Status updated', 'success'),
      onConflict: () => {
        addToast('Updated by another user — refreshing', 'error')
        load()
      },
      onError: () => addToast('Update failed, reverted', 'error'),
    })
  }, [updateStatus, addToast, load])

  const handleResultsSave = useCallback(async (
    id: string,
    payload: AuditResultsPayload,
  ) => {
    try {
      const updated = await updateAuditResults(id, payload)
      setRecords((prev) => prev.map((r) => r.id === id ? updated : r))
      addToast('Results saved', 'success')
    } catch {
      addToast('Failed to save results', 'error')
    }
  }, [setRecords, addToast])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-gray-900">Audits</h1>
            <p className="text-sm text-gray-500 mt-0.5">Front Office Audit submissions</p>
          </div>
          <div className="flex items-center gap-4">
            <a href="/ops/leads"    className="text-sm text-blue-600 hover:underline">Leads</a>
            <a href="/ops/tasks"    className="text-sm text-blue-600 hover:underline">Tasks</a>
            <a href="/ops/outreach" className="text-sm text-blue-600 hover:underline">← Outreach</a>
            <div className="flex flex-col items-end">
              <button
                onClick={handleSignOut}
                disabled={signingOut}
                className="text-sm text-gray-400 hover:text-gray-600 disabled:cursor-wait disabled:opacity-50 transition-colors"
              >
                {signingOut ? 'Signing out…' : 'Sign out'}
              </button>
              {signOutError && (
                <span className="text-xs text-red-500 mt-0.5">{signOutError}</span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        {loading && (
          <div className="py-16 text-center text-sm text-gray-400">Loading…</div>
        )}

        {error && !loading && (
          <div className="py-10 text-center">
            <p className="text-sm text-red-600">{error}</p>
            <button onClick={load} className="mt-3 text-sm text-blue-600 hover:underline">
              Retry
            </button>
          </div>
        )}

        {!loading && !error && records.length === 0 && (
          <div className="py-16 text-center">
            <p className="text-sm text-gray-400">No audit submissions yet.</p>
            <a href="/audit/request" className="mt-2 block text-sm text-blue-600 hover:underline">
              View audit request form →
            </a>
          </div>
        )}

        {!loading && !error && records.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Business</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Contact</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Industry</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Submitted</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Score</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Rating</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Package</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r, i) => (
                  <Fragment key={r.id}>
                    <tr
                      onClick={() => setExpandedId(expandedId === r.id ? null : r.id)}
                      className={[
                        'border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors',
                        i % 2 !== 0 ? 'bg-gray-50/50' : '',
                        expandedId === r.id ? 'bg-blue-50/40' : '',
                      ].join(' ')}
                    >
                      <td className="px-4 py-3 font-medium text-gray-900">{r.business_name}</td>
                      <td className="px-4 py-3 text-gray-700">{r.contact_name ?? '—'}</td>
                      <td className="px-4 py-3 text-gray-600">{r.industry ?? '—'}</td>
                      <td className="px-4 py-3 text-gray-500 tabular-nums">
                        {r.created_at.split('T')[0]}
                      </td>
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <select
                          value={r.status}
                          disabled={savingIds.has(r.id)}
                          onChange={(e) =>
                            handleStatusChange(r, e.target.value as AuditStatus)
                          }
                          className={`text-xs font-medium rounded px-2 py-0.5 border border-transparent focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400 cursor-pointer disabled:cursor-wait disabled:opacity-60 ${STATUS_COLORS[r.status]}`}
                        >
                          {ALL_STATUSES.map((s) => (
                            <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                          ))}
                        </select>
                        {savingIds.has(r.id) && (
                          <div className="text-xs text-gray-400 mt-0.5">Saving…</div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-700 tabular-nums">
                        {r.audit_score ?? '—'}
                      </td>
                      <td className="px-4 py-3">
                        {r.audit_rating ? (
                          <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${RATING_COLORS[r.audit_rating] ?? ''}`}>
                            {r.audit_rating}
                          </span>
                        ) : '—'}
                      </td>
                      <td className="px-4 py-3 text-gray-600 text-xs">
                        {r.recommended_package ?? '—'}
                      </td>
                    </tr>
                    {expandedId === r.id && (
                      <tr className="bg-blue-50/20 border-b border-gray-100">
                        <td colSpan={8} className="px-4 py-5 space-y-6">
                          <DetailPanel record={r} />
                          <ScoringDrawer record={r} onSave={handleResultsSave} />
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
            <div className="px-4 py-2.5 border-t border-gray-100 text-xs text-gray-400">
              {records.length} submission{records.length !== 1 ? 's' : ''}
            </div>
          </div>
        )}
      </div>

      <ToastContainer toasts={toasts} dismiss={dismiss} />
    </div>
  )
}

const AUDIT_AREAS: { key: keyof AuditRecord; label: string }[] = [
  { key: 'score_missed_call',        label: 'Missed Call Process' },
  { key: 'score_lead_response',      label: 'Lead Response Speed' },
  { key: 'score_estimate_followup',  label: 'Estimate Follow-Up' },
  { key: 'score_noshow',             label: 'No-Show Recovery' },
  { key: 'score_stale_recovery',     label: 'Stale Lead Revival' },
  { key: 'score_pipeline_visibility', label: 'Pipeline Visibility' },
]

const PACKAGE_OPTIONS: [AuditPackage | '', string][] = [
  ['',             'None'],
  ['launch_sprint', 'Launch Sprint'],
  ['growth_system', 'Growth System'],
  ['ai_os',         'AI OS'],
  ['not_a_fit',     'Not a Fit'],
]

const SCORE_COLORS: Record<AuditRating, string> = {
  red:    'bg-red-100 text-red-700 border-red-200',
  yellow: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  green:  'bg-green-100 text-green-700 border-green-200',
}

function ScoringDrawer({
  record,
  onSave,
}: {
  record: AuditRecord
  onSave: (id: string, payload: AuditResultsPayload) => Promise<void>
}) {
  const [scores, setScores] = useState<Record<string, AuditRating | ''>>(() => ({
    score_missed_call:         record.score_missed_call         ?? '',
    score_lead_response:       record.score_lead_response       ?? '',
    score_estimate_followup:   record.score_estimate_followup   ?? '',
    score_noshow:              record.score_noshow              ?? '',
    score_stale_recovery:      record.score_stale_recovery      ?? '',
    score_pipeline_visibility: record.score_pipeline_visibility ?? '',
  }))
  const [findings, setFindings] = useState({
    top_finding_1: record.top_finding_1 ?? '',
    top_finding_2: record.top_finding_2 ?? '',
    top_finding_3: record.top_finding_3 ?? '',
  })
  const [auditorNotes, setAuditorNotes]     = useState(record.auditor_notes ?? '')
  const [recPackage, setRecPackage]         = useState<AuditPackage | ''>(record.recommended_package ?? '')
  const [proposalSent, setProposalSent]     = useState(record.proposal_sent ?? false)
  const [saving, setSaving]                 = useState(false)

  async function handleSave() {
    setSaving(true)
    await onSave(record.id, {
      score_missed_call:         scores.score_missed_call         || null,
      score_lead_response:       scores.score_lead_response       || null,
      score_estimate_followup:   scores.score_estimate_followup   || null,
      score_noshow:              scores.score_noshow              || null,
      score_stale_recovery:      scores.score_stale_recovery      || null,
      score_pipeline_visibility: scores.score_pipeline_visibility || null,
      top_finding_1:   findings.top_finding_1   || null,
      top_finding_2:   findings.top_finding_2   || null,
      top_finding_3:   findings.top_finding_3   || null,
      auditor_notes:   auditorNotes             || null,
      recommended_package: recPackage           || null,
      proposal_sent:   proposalSent,
    })
    setSaving(false)
  }

  return (
    <div className="border border-gray-200 rounded-lg bg-white p-5 space-y-5">
      <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-400">Audit Scores</h3>

      {/* 6-area scores */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {AUDIT_AREAS.map(({ key, label }) => {
          const val = scores[key] as AuditRating | ''
          return (
            <div key={key}>
              <p className="text-xs text-gray-500 mb-1">{label}</p>
              <div className="flex gap-1.5">
                {(['red', 'yellow', 'green'] as AuditRating[]).map((rating) => (
                  <button
                    key={rating}
                    onClick={() => setScores((s) => ({ ...s, [key]: val === rating ? '' : rating }))}
                    className={`px-2.5 py-0.5 rounded text-xs font-medium border transition-opacity ${
                      SCORE_COLORS[rating]
                    } ${val === rating ? 'opacity-100 ring-2 ring-offset-1 ring-current' : 'opacity-40 hover:opacity-70'}`}
                  >
                    {rating.charAt(0).toUpperCase() + rating.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* Top findings */}
      <div className="grid sm:grid-cols-3 gap-3">
        {(['top_finding_1', 'top_finding_2', 'top_finding_3'] as const).map((k, i) => (
          <div key={k}>
            <label className="block text-xs text-gray-500 mb-1">Top Finding {i + 1}</label>
            <input
              type="text"
              value={findings[k]}
              onChange={(e) => setFindings((f) => ({ ...f, [k]: e.target.value }))}
              placeholder={`Finding ${i + 1}…`}
              className="w-full border border-gray-200 rounded px-2.5 py-1.5 text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-400"
            />
          </div>
        ))}
      </div>

      {/* Auditor notes */}
      <div>
        <label className="block text-xs text-gray-500 mb-1">Auditor Notes</label>
        <textarea
          rows={3}
          value={auditorNotes}
          onChange={(e) => setAuditorNotes(e.target.value)}
          placeholder="Internal notes for this audit…"
          className="w-full border border-gray-200 rounded px-2.5 py-1.5 text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-400 resize-y"
        />
      </div>

      {/* Package + proposal */}
      <div className="flex flex-wrap items-center gap-4">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Recommended Package</label>
          <select
            value={recPackage}
            onChange={(e) => setRecPackage(e.target.value as AuditPackage | '')}
            className="border border-gray-200 rounded px-2.5 py-1.5 text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white"
          >
            {PACKAGE_OPTIONS.map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
        </div>
        <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
          <input
            type="checkbox"
            checked={proposalSent}
            onChange={(e) => setProposalSent(e.target.checked)}
            className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
          />
          Proposal sent
        </label>
        <button
          onClick={handleSave}
          disabled={saving}
          className="ml-auto text-xs bg-gray-900 text-white rounded px-4 py-1.5 font-medium hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-wait"
        >
          {saving ? 'Saving…' : 'Save Results'}
        </button>
      </div>
    </div>
  )
}

function DetailPanel({ record: r }: { record: AuditRecord }) {
  const rows: [string, string | number | null | undefined][] = [
    ['Email',                    r.email],
    ['Phone',                    r.phone],
    ['Website',                  r.website],
    ['Best contact method',      r.best_contact_method],
    ['Lead sources',             r.lead_sources],
    ['Current lead flow',        r.current_lead_flow],
    ['Inbound owner',            r.inbound_owner],
    ['Response speed',           r.response_speed],
    ['Missed call process',      r.missed_call_process],
    ['Post-estimate process',    r.post_estimate_process],
    ['Follow-up owner',          r.follow_up_owner],
    ['Customer value',           r.approximate_customer_value],
    ['Biggest frustration',      r.biggest_front_office_frustration],
    ['Key revenue leaks',        r.key_revenue_leaks],
    ['Recommended starting fix', r.recommended_starting_fix],
  ]

  const filled = rows.filter(([, v]) => v !== null && v !== undefined && v !== '')

  if (filled.length === 0) {
    return <p className="text-xs text-gray-400">No additional details recorded.</p>
  }

  return (
    <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-2">
      {filled.map(([label, value]) => (
        <div key={label} className="flex gap-3 text-sm">
          <dt className="text-gray-400 shrink-0 w-44">{label}</dt>
          <dd className="text-gray-700 break-words">{String(value)}</dd>
        </div>
      ))}
    </dl>
  )
}
