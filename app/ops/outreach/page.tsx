'use client'

import { useEffect, useState, useCallback, Fragment } from 'react'
import { useRouter } from 'next/navigation'
import {
  fetchOutreachRecords,
  updateOutreachStatus,
  createOutreachRecord,
  updateOutreachRecord,
  type ProspectPayload,
} from '@/lib/outreach/adapter'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/useToast'
import { ToastContainer } from '@/components/ui/Toast'
import { ProspectDrawer } from '@/components/outreach/ProspectDrawer'
import type { OutreachRecord, OutreachStatus, OutreachCategory } from '@/lib/outreach/types'

// ---------------------------------------------------------------------------
// Label maps
// ---------------------------------------------------------------------------
const STATUS_LABELS: Record<OutreachStatus, string> = {
  lead_identified:      'Lead Identified',
  research_complete:    'Research Complete',
  outreach_sent:        'Outreach Sent',
  follow_up_1:          'Follow-up 1',
  follow_up_2:          'Follow-up 2',
  follow_up_3:          'Follow-up 3',
  conversation_started: 'Conversation Started',
  audit_offered:        'Audit Offered',
  audit_booked:         'Audit Booked',
  audit_completed:      'Audit Completed',
  proposal_sent:        'Proposal Sent',
  negotiation:          'Negotiation',
  won:                  'Won',
  lost:                 'Lost',
  future_follow_up:     'Future Follow-up',
}

const STATUS_COLORS: Record<OutreachStatus, string> = {
  lead_identified:      'bg-gray-100 text-gray-700',
  research_complete:    'bg-gray-100 text-gray-700',
  outreach_sent:        'bg-blue-50 text-blue-700',
  follow_up_1:          'bg-blue-50 text-blue-700',
  follow_up_2:          'bg-yellow-50 text-yellow-700',
  follow_up_3:          'bg-orange-50 text-orange-700',
  conversation_started: 'bg-indigo-50 text-indigo-700',
  audit_offered:        'bg-purple-50 text-purple-700',
  audit_booked:         'bg-purple-100 text-purple-800',
  audit_completed:      'bg-teal-50 text-teal-700',
  proposal_sent:        'bg-cyan-50 text-cyan-700',
  negotiation:          'bg-amber-50 text-amber-700',
  won:                  'bg-green-100 text-green-800',
  lost:                 'bg-red-50 text-red-600',
  future_follow_up:     'bg-gray-100 text-gray-500',
}

const CATEGORY_LABELS: Record<OutreachCategory, string> = {
  hotel:                'Hotel',
  restaurant:           'Restaurant',
  retail:               'Retail',
  healthcare:           'Healthcare',
  professional_services:'Professional Services',
  other:                'Other',
}

const ALL_STATUSES  = Object.keys(STATUS_LABELS)  as OutreachStatus[]
const ALL_CATEGORIES = Object.keys(CATEGORY_LABELS) as OutreachCategory[]

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function OutreachPage() {
  const router = useRouter()
  const { toasts, addToast, dismiss } = useToast()

  const [records, setRecords]               = useState<OutreachRecord[]>([])
  const [loading, setLoading]               = useState(true)
  const [error, setError]                   = useState<string | null>(null)
  const [filterCategory, setFilterCategory] = useState('')
  const [filterStatus, setFilterStatus]     = useState('')
  const [savingIds, setSavingIds]           = useState<Set<string>>(new Set())
  const [expandedId, setExpandedId]         = useState<string | null>(null)
  const [showDrawer, setShowDrawer]         = useState(false)
  const [editingRecord, setEditingRecord]   = useState<OutreachRecord | null>(null)
  const [drawerSaving, setDrawerSaving]     = useState(false)
  const [signingOut, setSigningOut]         = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setRecords(await fetchOutreachRecords({
        category: filterCategory || undefined,
        status:   filterStatus   || undefined,
      }))
    } catch {
      setError('Failed to load outreach records. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [filterCategory, filterStatus])

  useEffect(() => { load() }, [load])

  const handleSignOut = useCallback(async () => {
    setSigningOut(true)
    const { error } = await supabase.auth.signOut()
    if (error) { setSigningOut(false); return }
    router.push('/auth/signin')
  }, [router])

  // ---- Status inline toggle ----
  const handleStatusChange = useCallback(async (
    id: string,
    newStatus: OutreachStatus,
    prevStatus: OutreachStatus,
  ) => {
    if (newStatus === prevStatus) return
    setRecords(prev => prev.map(r => r.id === id ? { ...r, status: newStatus } : r))
    setSavingIds(prev => new Set(prev).add(id))
    try {
      await updateOutreachStatus(id, newStatus)
    } catch {
      setRecords(prev => prev.map(r => r.id === id ? { ...r, status: prevStatus } : r))
      addToast('Status update failed, reverted', 'error')
    } finally {
      setSavingIds(prev => { const n = new Set(prev); n.delete(id); return n })
    }
  }, [addToast])

  // ---- Add / Edit ----
  const handleDrawerSave = useCallback(async (payload: ProspectPayload) => {
    setDrawerSaving(true)
    try {
      if (editingRecord) {
        const updated = await updateOutreachRecord(editingRecord.id, payload)
        setRecords(prev => prev.map(r => r.id === editingRecord.id ? updated : r))
        addToast('Prospect updated', 'success')
      } else {
        const created = await createOutreachRecord(payload)
        setRecords(prev => [created, ...prev])
        addToast('Prospect added', 'success')
      }
      setShowDrawer(false)
      setEditingRecord(null)
    } catch {
      addToast('Failed to save prospect', 'error')
    } finally {
      setDrawerSaving(false)
    }
  }, [editingRecord, addToast])

  const openCreate = () => { setEditingRecord(null); setShowDrawer(true) }
  const openEdit   = (r: OutreachRecord) => { setEditingRecord(r); setShowDrawer(true) }
  const closeDrawer = () => { setShowDrawer(false); setEditingRecord(null) }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-gray-900">Outreach Tracker</h1>
            <p className="text-sm text-gray-500 mt-0.5">Front Office Audit pipeline</p>
          </div>
          <div className="flex items-center gap-4">
            <a href="/ops/audits"    className="text-sm text-blue-600 hover:underline">Audits</a>
            <a href="/ops/leads"     className="text-sm text-blue-600 hover:underline">Leads</a>
            <a href="/automation"    className="text-sm text-blue-600 hover:underline">Automation</a>
            <button
              onClick={handleSignOut}
              disabled={signingOut}
              className="text-sm text-gray-400 hover:text-gray-600 disabled:cursor-wait disabled:opacity-50 transition-colors"
            >
              {signingOut ? 'Signing out...' : 'Sign out'}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3 mb-5">
          <select
            value={filterCategory}
            onChange={e => setFilterCategory(e.target.value)}
            className="text-sm border border-gray-300 rounded-md px-3 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Categories</option>
            {ALL_CATEGORIES.map(c => (
              <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
            ))}
          </select>

          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="text-sm border border-gray-300 rounded-md px-3 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Statuses</option>
            {ALL_STATUSES.map(s => (
              <option key={s} value={s}>{STATUS_LABELS[s]}</option>
            ))}
          </select>

          {(filterCategory || filterStatus) && (
            <button
              onClick={() => { setFilterCategory(''); setFilterStatus('') }}
              className="text-sm text-gray-400 hover:text-gray-600 underline"
            >
              Clear filters
            </button>
          )}

          <div className="ml-auto flex items-center gap-2">
            <span className="text-xs text-gray-400">
              {!loading && `${records.length} record${records.length !== 1 ? 's' : ''}`}
            </span>
            <button
              onClick={openCreate}
              className="text-sm bg-gray-900 text-white rounded-md px-4 py-1.5 font-medium hover:bg-gray-700 transition-colors"
            >
              + Add Prospect
            </button>
          </div>
        </div>

        {/* States */}
        {loading && (
          <div className="py-16 text-center text-sm text-gray-400">Loading...</div>
        )}
        {error && !loading && (
          <div className="py-10 text-center">
            <p className="text-sm text-red-600">{error}</p>
            <button onClick={load} className="mt-3 text-sm text-blue-600 hover:underline">Retry</button>
          </div>
        )}
        {!loading && !error && records.length === 0 && (
          <div className="py-16 text-center">
            <p className="text-sm text-gray-400">
              {filterCategory || filterStatus ? 'No records match your filters.' : 'No prospects yet.'}
            </p>
            {filterCategory || filterStatus ? (
              <button
                onClick={() => { setFilterCategory(''); setFilterStatus('') }}
                className="mt-2 text-sm text-blue-600 hover:underline"
              >
                Clear filters
              </button>
            ) : (
              <button onClick={openCreate} className="mt-2 text-sm text-blue-600 hover:underline">
                Add your first prospect
              </button>
            )}
          </div>
        )}

        {/* Table */}
        {!loading && !error && records.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Company</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Contact</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Category</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Last Activity</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 w-8"></th>
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
                        expandedId === r.id ? 'bg-blue-50/30' : '',
                      ].join(' ')}
                    >
                      <td className="px-4 py-3 font-medium text-gray-900">{r.company_name}</td>
                      <td className="px-4 py-3 text-gray-700">
                        <div>{r.contact_name || '—'}</div>
                        {r.contact_title && (
                          <div className="text-xs text-gray-400">{r.contact_title}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {CATEGORY_LABELS[r.category]}
                      </td>
                      <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                        <select
                          value={r.status}
                          disabled={savingIds.has(r.id)}
                          onChange={e =>
                            handleStatusChange(r.id, e.target.value as OutreachStatus, r.status)
                          }
                          className={`text-xs font-medium rounded px-2 py-0.5 border border-transparent focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400 cursor-pointer disabled:cursor-wait disabled:opacity-60 ${STATUS_COLORS[r.status]}`}
                        >
                          {ALL_STATUSES.map(s => (
                            <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                          ))}
                        </select>
                        {savingIds.has(r.id) && (
                          <div className="text-xs text-gray-400 mt-0.5">Saving...</div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-500 tabular-nums">
                        {r.last_activity_date}
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs">
                        {expandedId === r.id ? '▲' : '▼'}
                      </td>
                    </tr>

                    {expandedId === r.id && (
                      <tr className="bg-blue-50/20 border-b border-gray-100">
                        <td colSpan={6} className="px-4 py-4">
                          <ProspectDetailPanel
                            record={r}
                            onEdit={() => openEdit(r)}
                          />
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
            <div className="px-4 py-2.5 border-t border-gray-100 text-xs text-gray-400">
              {records.length} record{records.length !== 1 ? 's' : ''}
            </div>
          </div>
        )}
      </div>

      {/* Prospect Drawer */}
      {showDrawer && (
        <ProspectDrawer
          initial={editingRecord ?? undefined}
          saving={drawerSaving}
          onSave={handleDrawerSave}
          onClose={closeDrawer}
        />
      )}

      <ToastContainer toasts={toasts} dismiss={dismiss} />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Detail panel — shown when a row is expanded
// ---------------------------------------------------------------------------
function ProspectDetailPanel({
  record: r,
  onEdit,
}: {
  record: OutreachRecord
  onEdit: () => void
}) {
  const fields: [string, string | number | undefined | null][] = [
    ['City',                 r.city],
    ['Phone',                r.phone],
    ['Email',                r.contact_email],
    ['Outreach channel',     r.outreach_channel],
    ['Personalization note', r.personalization_note],
    ['First contact',        r.first_contact_date],
    ['Follow-up 1',          r.follow_up_1_date],
    ['Follow-up 2',          r.follow_up_2_date],
    ['Follow-up 3',          r.follow_up_3_date],
    ['Audit date',           r.audit_date],
    ['Proposal date',        r.proposal_date],
    ['Outcome',              r.outcome],
  ]
  const filled = fields.filter(([, v]) => v !== null && v !== undefined && v !== '')

  return (
    <div className="space-y-3">
      {filled.length > 0 && (
        <dl className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-2">
          {filled.map(([label, value]) => (
            <div key={label} className="text-sm">
              <dt className="text-xs text-gray-400">{label}</dt>
              <dd className="text-gray-700 mt-0.5">{String(value)}</dd>
            </div>
          ))}
        </dl>
      )}
      {r.notes && (
        <div className="text-sm">
          <p className="text-xs text-gray-400 mb-1">Notes</p>
          <p className="text-gray-700 whitespace-pre-line leading-relaxed">{r.notes}</p>
        </div>
      )}
      <div>
        <button
          onClick={onEdit}
          className="text-xs text-blue-600 hover:underline"
        >
          Edit prospect
        </button>
      </div>
    </div>
  )
}
