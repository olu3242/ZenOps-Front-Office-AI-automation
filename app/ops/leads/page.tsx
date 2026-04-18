'use client'

import { useEffect, useCallback, useState, Fragment } from 'react'
import { useRouter } from 'next/navigation'
import { fetchLeads, updateLeadStatus, createLead, updateLead, deleteLead } from '@/lib/leads/adapter'
import { supabase } from '@/lib/supabase'
import { useOptimisticStatus } from '@/hooks/useOptimisticStatus'
import { useToast } from '@/hooks/useToast'
import { ToastContainer } from '@/components/ui/Toast'
import type { Lead, LeadStatus } from '@/lib/leads/types'

const ALL_STATUSES: LeadStatus[] = ['new', 'contacted', 'qualified', 'converted', 'lost']

const STATUS_LABELS: Record<LeadStatus, string> = {
  new:       'New',
  contacted: 'Contacted',
  qualified: 'Qualified',
  converted: 'Converted',
  lost:      'Lost',
}

const STATUS_COLORS: Record<LeadStatus, string> = {
  new:       'bg-gray-100 text-gray-700',
  contacted: 'bg-blue-50 text-blue-700',
  qualified: 'bg-purple-50 text-purple-700',
  converted: 'bg-green-100 text-green-800',
  lost:      'bg-red-50 text-red-600',
}

const SOURCE_OPTIONS = ['', 'referral', 'google', 'facebook', 'instagram', 'cold_outreach', 'website', 'other']

// ---------------------------------------------------------------------------
// Add Lead modal
// ---------------------------------------------------------------------------
function AddLeadModal({
  initial,
  saving,
  onSave,
  onClose,
}: {
  initial?: Lead
  saving: boolean
  onSave: (payload: Omit<Lead, 'id' | 'created_at' | 'updated_at'>) => Promise<void>
  onClose: () => void
}) {
  const isEdit = !!initial
  const [form, setForm] = useState({
    business_name: initial?.business_name ?? '',
    contact_name:  initial?.contact_name  ?? '',
    email:         initial?.email         ?? '',
    phone:         initial?.phone         ?? '',
    source:        initial?.source        ?? '',
    status:        initial?.status        ?? 'new' as LeadStatus,
    notes:         initial?.notes         ?? '',
  })
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  function set(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
    setErr(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.business_name.trim()) { setErr('Business name is required.'); return }
    await onSave({
      business_name: form.business_name.trim(),
      contact_name:  form.contact_name.trim() || null,
      email:         form.email.trim()        || null,
      phone:         form.phone.trim()        || null,
      source:        form.source              || null,
      status:        form.status,
      notes:         form.notes.trim()        || null,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900">{isEdit ? 'Edit Lead' : 'Add Lead'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg leading-none">&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Business Name <span className="text-red-500">*</span></label>
            <input type="text" value={form.business_name} onChange={e => set('business_name', e.target.value)}
              placeholder="e.g. Apex HVAC"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Contact Name</label>
              <input type="text" value={form.contact_name} onChange={e => set('contact_name', e.target.value)}
                placeholder="First Last"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
              <select value={form.status} onChange={e => set('status', e.target.value)}
                className="w-full border border-gray-300 rounded-md px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                {ALL_STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
              <input type="email" value={form.email} onChange={e => set('email', e.target.value)}
                placeholder="name@company.com"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Phone</label>
              <input type="tel" value={form.phone} onChange={e => set('phone', e.target.value)}
                placeholder="(555) 000-0000"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Source</label>
            <select value={form.source} onChange={e => set('source', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
              {SOURCE_OPTIONS.map(s => <option key={s} value={s}>{s || 'Select...'}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
            <textarea rows={2} value={form.notes} onChange={e => set('notes', e.target.value)}
              placeholder="Any context..."
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
          </div>
          {err && <p className="text-xs text-red-600">{err}</p>}
          <div className="flex items-center justify-end gap-3 pt-1">
            <button type="button" onClick={onClose} className="text-sm text-gray-500 hover:text-gray-700">Cancel</button>
            <button type="submit" disabled={saving}
              className="text-sm bg-gray-900 text-white rounded-md px-5 py-2 font-medium hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-wait">
              {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Add Lead'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function LeadsPage() {
  const router = useRouter()
  const { toasts, addToast, dismiss } = useToast()
  const { records, setRecords, savingIds, updateStatus } = useOptimisticStatus<Lead>([])

  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState('')
  const [search, setSearch] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [showModal, setShowModal]     = useState(false)
  const [editingLead, setEditingLead] = useState<Lead | null>(null)
  const [modalSaving, setModalSaving] = useState(false)
  const [deletingId, setDeletingId]   = useState<string | null>(null)
  const [signingOut, setSigningOut]   = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setRecords(await fetchLeads())
    } catch {
      setError('Failed to load leads. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [setRecords])

  useEffect(() => { load() }, [load])

  const handleSignOut = useCallback(async () => {
    setSigningOut(true)
    const { error } = await supabase.auth.signOut()
    if (error) { setSigningOut(false); return }
    router.push('/auth/signin')
  }, [router])

  const handleStatusChange = useCallback(async (lead: Lead, newStatus: LeadStatus) => {
    if (newStatus === lead.status) return
    await updateStatus({
      id: lead.id,
      optimistic: { status: newStatus },
      apiCall: () => updateLeadStatus(lead.id, newStatus, lead.updated_at),
      onSuccess:  () => addToast('Status updated', 'success'),
      onConflict: () => { addToast('Updated by another user — refreshing', 'error'); load() },
      onError:    () => addToast('Update failed, reverted', 'error'),
    })
  }, [updateStatus, addToast, load])

  const handleSave = useCallback(async (payload: Omit<Lead, 'id' | 'created_at' | 'updated_at'>) => {
    setModalSaving(true)
    try {
      if (editingLead) {
        const updated = await updateLead(editingLead.id, payload)
        setRecords(prev => prev.map(r => r.id === editingLead.id ? updated : r))
        addToast('Lead updated', 'success')
      } else {
        const created = await createLead(payload)
        setRecords(prev => [created, ...prev])
        addToast('Lead added', 'success')
      }
      setShowModal(false)
      setEditingLead(null)
    } catch {
      addToast(editingLead ? 'Failed to update lead' : 'Failed to add lead', 'error')
    } finally {
      setModalSaving(false)
    }
  }, [editingLead, setRecords, addToast])

  const handleDelete = useCallback(async (id: string) => {
    setDeletingId(id)
    try {
      await deleteLead(id)
      setRecords(prev => prev.filter(r => r.id !== id))
      setExpandedId(null)
      addToast('Lead deleted', 'info')
    } catch {
      addToast('Failed to delete lead', 'error')
    } finally {
      setDeletingId(null)
    }
  }, [setRecords, addToast])

  const visible = records.filter(r => {
    if (filterStatus && r.status !== filterStatus) return false
    if (search) {
      const q = search.toLowerCase()
      return (r.business_name + (r.contact_name ?? '') + (r.email ?? '')).toLowerCase().includes(q)
    }
    return true
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-gray-900">Leads</h1>
            <p className="text-sm text-gray-500 mt-0.5">Front Office pipeline</p>
          </div>
          <div className="flex items-center gap-4">
            <a href="/ops/audits"   className="text-sm text-blue-600 hover:underline">Audits</a>
            <a href="/ops/tasks"    className="text-sm text-blue-600 hover:underline">Tasks</a>
            <a href="/ops/outreach" className="text-sm text-blue-600 hover:underline">Outreach</a>
            <button onClick={handleSignOut} disabled={signingOut}
              className="text-sm text-gray-400 hover:text-gray-600 disabled:cursor-wait disabled:opacity-50 transition-colors">
              {signingOut ? 'Signing out...' : 'Sign out'}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex flex-wrap items-center gap-3 mb-5">
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..."
            className="text-sm border border-gray-300 rounded-md px-3 py-1.5 w-48 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            className="text-sm border border-gray-300 rounded-md px-3 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">All Statuses</option>
            {ALL_STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
          </select>
          {(filterStatus || search) && (
            <button onClick={() => { setFilterStatus(''); setSearch('') }} className="text-sm text-gray-400 hover:text-gray-600 underline">Clear</button>
          )}
          <div className="ml-auto flex items-center gap-2">
            <span className="text-xs text-gray-400">{!loading && `${visible.length} lead${visible.length !== 1 ? 's' : ''}`}</span>
            <button onClick={() => setShowModal(true)}
              className="text-sm bg-gray-900 text-white rounded-md px-4 py-1.5 font-medium hover:bg-gray-700 transition-colors">
              + Add Lead
            </button>
          </div>
        </div>

        {loading && <div className="py-16 text-center text-sm text-gray-400">Loading...</div>}
        {error && !loading && (
          <div className="py-10 text-center">
            <p className="text-sm text-red-600">{error}</p>
            <button onClick={load} className="mt-3 text-sm text-blue-600 hover:underline">Retry</button>
          </div>
        )}
        {!loading && !error && visible.length === 0 && (
          <div className="py-16 text-center">
            <p className="text-sm text-gray-400">{filterStatus ? 'No leads match the filter.' : 'No leads yet.'}</p>
            {!filterStatus && (
              <button onClick={() => setShowModal(true)} className="mt-2 text-sm text-blue-600 hover:underline">Add your first lead</button>
            )}
          </div>
        )}

        {!loading && !error && visible.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Business</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Contact</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Email</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Phone</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Source</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Added</th>
                  <th className="px-4 py-3 w-6"></th>
                </tr>
              </thead>
              <tbody>
                {visible.map((r, i) => (
                  <Fragment key={r.id}>
                    <tr
                      onClick={() => setExpandedId(expandedId === r.id ? null : r.id)}
                      className={[
                        'border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors',
                        i % 2 !== 0 ? 'bg-gray-50/50' : '',
                        expandedId === r.id ? 'bg-blue-50/30' : '',
                      ].join(' ')}
                    >
                      <td className="px-4 py-3 font-medium text-gray-900">{r.business_name}</td>
                      <td className="px-4 py-3 text-gray-700">{r.contact_name ?? '—'}</td>
                      <td className="px-4 py-3 text-gray-600">
                        {r.email
                          ? <a href={`mailto:${r.email}`} onClick={e => e.stopPropagation()} className="text-blue-600 hover:underline">{r.email}</a>
                          : '—'}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{r.phone ?? '—'}</td>
                      <td className="px-4 py-3 text-gray-500 capitalize">{r.source ?? '—'}</td>
                      <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                        <select
                          value={r.status}
                          disabled={savingIds.has(r.id)}
                          onChange={e => handleStatusChange(r, e.target.value as LeadStatus)}
                          className={`text-xs font-medium rounded px-2 py-0.5 border border-transparent focus:outline-none focus:ring-1 focus:ring-blue-400 cursor-pointer disabled:cursor-wait disabled:opacity-60 ${STATUS_COLORS[r.status]}`}
                        >
                          {ALL_STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                        </select>
                        {savingIds.has(r.id) && <div className="text-xs text-gray-400 mt-0.5">Saving...</div>}
                      </td>
                      <td className="px-4 py-3 text-gray-500 tabular-nums">{r.created_at.split('T')[0]}</td>
                      <td className="px-4 py-3 text-gray-400 text-xs">{expandedId === r.id ? '▲' : '▼'}</td>
                    </tr>
                    {expandedId === r.id && (
                      <tr className="bg-blue-50/20 border-b border-gray-100">
                        <td colSpan={8} className="px-4 py-3 space-y-2">
                          {r.notes && <p className="text-sm text-gray-700 whitespace-pre-line">{r.notes}</p>}
                          <div className="flex items-center gap-3">
                            <button onClick={() => { setEditingLead(r); setShowModal(true) }}
                              className="text-xs text-blue-600 hover:underline">Edit</button>
                            <button onClick={() => handleDelete(r.id)} disabled={deletingId === r.id}
                              className="text-xs text-red-500 hover:underline disabled:opacity-50">
                              {deletingId === r.id ? 'Deleting...' : 'Delete'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
            <div className="px-4 py-2.5 border-t border-gray-100 text-xs text-gray-400">
              {visible.length} lead{visible.length !== 1 ? 's' : ''}
            </div>
          </div>
        )}
      </div>

      {showModal && (
        <AddLeadModal
          initial={editingLead ?? undefined}
          saving={modalSaving}
          onSave={handleSave}
          onClose={() => { setShowModal(false); setEditingLead(null) }}
        />
      )}

      <ToastContainer toasts={toasts} dismiss={dismiss} />
    </div>
  )
}
