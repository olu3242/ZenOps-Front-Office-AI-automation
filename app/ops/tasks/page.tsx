'use client'

import { useEffect, useCallback, useState, Fragment } from 'react'
import { useRouter } from 'next/navigation'
import { fetchTasks, updateTaskStatus, createTask } from '@/lib/tasks/adapter'
import { supabase } from '@/lib/supabase'
import { useOptimisticStatus } from '@/hooks/useOptimisticStatus'
import { useToast } from '@/hooks/useToast'
import { ToastContainer } from '@/components/ui/Toast'
import type { Task, TaskStatus } from '@/lib/tasks/types'

const ALL_STATUSES: TaskStatus[] = ['todo', 'in_progress', 'blocked', 'done']

const STATUS_LABELS: Record<TaskStatus, string> = {
  todo:        'To Do',
  in_progress: 'In Progress',
  blocked:     'Blocked',
  done:        'Done',
}

const STATUS_COLORS: Record<TaskStatus, string> = {
  todo:        'bg-gray-100 text-gray-700',
  in_progress: 'bg-blue-50 text-blue-700',
  blocked:     'bg-orange-50 text-orange-700',
  done:        'bg-teal-50 text-teal-700',
}

// ---------------------------------------------------------------------------
// Add Task modal
// ---------------------------------------------------------------------------
function AddTaskModal({
  saving,
  onSave,
  onClose,
}: {
  saving: boolean
  onSave: (payload: Omit<Task, 'id' | 'created_at' | 'updated_at'>) => Promise<void>
  onClose: () => void
}) {
  const [form, setForm] = useState({
    title: '',
    description: '',
    due_date: '',
    assigned_to: '',
    status: 'todo' as TaskStatus,
    related_audit_id: null as string | null,
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
    if (!form.title.trim()) { setErr('Title is required.'); return }
    await onSave({
      title:            form.title.trim(),
      description:      form.description.trim()  || null,
      due_date:         form.due_date             || null,
      assigned_to:      form.assigned_to.trim()   || null,
      status:           form.status,
      related_audit_id: null,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900">Add Task</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg leading-none">&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Title <span className="text-red-500">*</span></label>
            <input type="text" value={form.title} onChange={e => set('title', e.target.value)}
              placeholder="e.g. Follow up with Apex HVAC"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
            <textarea rows={2} value={form.description} onChange={e => set('description', e.target.value)}
              placeholder="Any context or steps..."
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Due Date</label>
              <input type="date" value={form.due_date} onChange={e => set('due_date', e.target.value)}
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
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Assigned To</label>
            <input type="text" value={form.assigned_to} onChange={e => set('assigned_to', e.target.value)}
              placeholder="Name or email"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          {err && <p className="text-xs text-red-600">{err}</p>}
          <div className="flex items-center justify-end gap-3 pt-1">
            <button type="button" onClick={onClose} className="text-sm text-gray-500 hover:text-gray-700">Cancel</button>
            <button type="submit" disabled={saving}
              className="text-sm bg-gray-900 text-white rounded-md px-5 py-2 font-medium hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-wait">
              {saving ? 'Adding...' : 'Add Task'}
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
export default function TasksPage() {
  const router = useRouter()
  const { toasts, addToast, dismiss } = useToast()
  const { records, setRecords, savingIds, updateStatus } = useOptimisticStatus<Task>([])

  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState('')
  const [expandedId, setExpandedId]   = useState<string | null>(null)
  const [showModal, setShowModal]     = useState(false)
  const [modalSaving, setModalSaving] = useState(false)
  const [signingOut, setSigningOut]   = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setRecords(await fetchTasks())
    } catch {
      setError('Failed to load tasks. Please try again.')
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

  const handleStatusChange = useCallback(async (task: Task, newStatus: TaskStatus) => {
    if (newStatus === task.status) return
    await updateStatus({
      id: task.id,
      optimistic: { status: newStatus },
      apiCall: () => updateTaskStatus(task.id, newStatus, task.updated_at),
      onSuccess:  () => addToast('Status updated', 'success'),
      onConflict: () => { addToast('Updated by another user — refreshing', 'error'); load() },
      onError:    () => addToast('Update failed, reverted', 'error'),
    })
  }, [updateStatus, addToast, load])

  const handleCreate = useCallback(async (payload: Omit<Task, 'id' | 'created_at' | 'updated_at'>) => {
    setModalSaving(true)
    try {
      const created = await createTask(payload)
      setRecords(prev => [created, ...prev])
      setShowModal(false)
      addToast('Task added', 'success')
    } catch {
      addToast('Failed to add task', 'error')
    } finally {
      setModalSaving(false)
    }
  }, [setRecords, addToast])

  const visible = filterStatus ? records.filter(r => r.status === filterStatus) : records

  const overdue = (r: Task) =>
    r.due_date && r.status !== 'done' && r.due_date < new Date().toISOString().split('T')[0]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-gray-900">Tasks</h1>
            <p className="text-sm text-gray-500 mt-0.5">Front Office pipeline</p>
          </div>
          <div className="flex items-center gap-4">
            <a href="/ops/audits"   className="text-sm text-blue-600 hover:underline">Audits</a>
            <a href="/ops/leads"    className="text-sm text-blue-600 hover:underline">Leads</a>
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
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            className="text-sm border border-gray-300 rounded-md px-3 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">All Statuses</option>
            {ALL_STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
          </select>
          {filterStatus && (
            <button onClick={() => setFilterStatus('')} className="text-sm text-gray-400 hover:text-gray-600 underline">Clear</button>
          )}
          <div className="ml-auto flex items-center gap-2">
            <span className="text-xs text-gray-400">{!loading && `${visible.length} task${visible.length !== 1 ? 's' : ''}`}</span>
            <button onClick={() => setShowModal(true)}
              className="text-sm bg-gray-900 text-white rounded-md px-4 py-1.5 font-medium hover:bg-gray-700 transition-colors">
              + Add Task
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
            <p className="text-sm text-gray-400">{filterStatus ? 'No tasks match the filter.' : 'No tasks yet.'}</p>
            {!filterStatus && (
              <button onClick={() => setShowModal(true)} className="mt-2 text-sm text-blue-600 hover:underline">Add your first task</button>
            )}
          </div>
        )}

        {!loading && !error && visible.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Title</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Assigned To</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Due</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Created</th>
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
                        r.status === 'blocked' ? 'bg-orange-50/30' : '',
                        expandedId === r.id ? 'bg-blue-50/30' : '',
                      ].join(' ')}
                    >
                      <td className="px-4 py-3 font-medium text-gray-900">{r.title}</td>
                      <td className="px-4 py-3 text-gray-500">{r.assigned_to ?? '—'}</td>
                      <td className={`px-4 py-3 tabular-nums whitespace-nowrap ${overdue(r) ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
                        {r.due_date ?? '—'}
                        {overdue(r) && <span className="ml-1 text-xs">(overdue)</span>}
                      </td>
                      <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                        <select
                          value={r.status}
                          disabled={savingIds.has(r.id)}
                          onChange={e => handleStatusChange(r, e.target.value as TaskStatus)}
                          className={`text-xs font-medium rounded px-2 py-0.5 border border-transparent focus:outline-none focus:ring-1 focus:ring-blue-400 cursor-pointer disabled:cursor-wait disabled:opacity-60 ${STATUS_COLORS[r.status]}`}
                        >
                          {ALL_STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                        </select>
                        {savingIds.has(r.id) && <div className="text-xs text-gray-400 mt-0.5">Saving...</div>}
                      </td>
                      <td className="px-4 py-3 text-gray-500 tabular-nums">{r.created_at.split('T')[0]}</td>
                      <td className="px-4 py-3 text-gray-400 text-xs">{expandedId === r.id ? '▲' : '▼'}</td>
                    </tr>
                    {expandedId === r.id && r.description && (
                      <tr className="bg-blue-50/20 border-b border-gray-100">
                        <td colSpan={6} className="px-4 py-3">
                          <p className="text-xs text-gray-400 mb-1">Description</p>
                          <p className="text-sm text-gray-700 whitespace-pre-line">{r.description}</p>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
            <div className="px-4 py-2.5 border-t border-gray-100 text-xs text-gray-400">
              {visible.length} task{visible.length !== 1 ? 's' : ''}
              {visible.filter(r => overdue(r)).length > 0 && (
                <span className="ml-2 text-red-500">
                  · {visible.filter(r => overdue(r)).length} overdue
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {showModal && (
        <AddTaskModal
          saving={modalSaving}
          onSave={handleCreate}
          onClose={() => setShowModal(false)}
        />
      )}

      <ToastContainer toasts={toasts} dismiss={dismiss} />
    </div>
  )
}
