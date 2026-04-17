'use client'

import { useEffect, useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'
import { fetchTasks, updateTaskStatus } from '@/lib/tasks/adapter'
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

export default function TasksPage() {
  const router = useRouter()
  const { toasts, addToast, dismiss } = useToast()
  const { records, setRecords, savingIds, updateStatus } = useOptimisticStatus<Task>([])

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState('')
  const [signingOut, setSigningOut] = useState(false)
  const [signOutError, setSignOutError] = useState<string | null>(null)

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
    task: Task,
    newStatus: TaskStatus,
  ) => {
    if (newStatus === task.status) return

    await updateStatus({
      id: task.id,
      optimistic: { status: newStatus },
      apiCall: () => updateTaskStatus(task.id, newStatus, task.updated_at),
      onSuccess:  () => addToast('Status updated', 'success'),
      onConflict: () => {
        addToast('Updated by another user — refreshing', 'error')
        load()
      },
      onError: () => addToast('Update failed, reverted', 'error'),
    })
  }, [updateStatus, addToast, load])

  const visible = filterStatus
    ? records.filter((r) => r.status === filterStatus)
    : records

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-gray-900">Tasks</h1>
            <p className="text-sm text-gray-500 mt-0.5">Front Office pipeline</p>
          </div>
          <div className="flex items-center gap-4">
            <a href="/ops/audits"   className="text-sm text-blue-600 hover:underline">Audits</a>
            <a href="/ops/leads"    className="text-sm text-blue-600 hover:underline">Leads</a>
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
        {/* Filter */}
        <div className="flex flex-wrap gap-3 mb-5">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="text-sm border border-gray-300 rounded-md px-3 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Statuses</option>
            {ALL_STATUSES.map((s) => (
              <option key={s} value={s}>{STATUS_LABELS[s]}</option>
            ))}
          </select>
          {filterStatus && (
            <button
              onClick={() => setFilterStatus('')}
              className="text-sm text-gray-400 hover:text-gray-600 underline"
            >
              Clear
            </button>
          )}
        </div>

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

        {!loading && !error && visible.length === 0 && (
          <div className="py-16 text-center">
            <p className="text-sm text-gray-400">
              {filterStatus ? 'No tasks match the selected filter.' : 'No tasks yet.'}
            </p>
            {filterStatus && (
              <button
                onClick={() => setFilterStatus('')}
                className="mt-2 text-sm text-blue-600 hover:underline"
              >
                Clear filter
              </button>
            )}
          </div>
        )}

        {!loading && !error && visible.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Title</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Description</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Due</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Created</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((r, i) => (
                  <tr
                    key={r.id}
                    className={`border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors ${i % 2 !== 0 ? 'bg-gray-50/50' : ''} ${r.status === 'blocked' ? 'bg-orange-50/30' : ''}`}
                  >
                    <td className="px-4 py-3 font-medium text-gray-900">{r.title}</td>
                    <td className="px-4 py-3 text-gray-500 max-w-xs truncate">
                      {r.description ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-500 tabular-nums whitespace-nowrap">
                      {r.due_date ?? '—'}
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={r.status}
                        disabled={savingIds.has(r.id)}
                        onChange={(e) =>
                          handleStatusChange(r, e.target.value as TaskStatus)
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
                    <td className="px-4 py-3 text-gray-500 tabular-nums">
                      {r.created_at.split('T')[0]}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="px-4 py-2.5 border-t border-gray-100 text-xs text-gray-400">
              {visible.length} task{visible.length !== 1 ? 's' : ''}
            </div>
          </div>
        )}
      </div>

      <ToastContainer toasts={toasts} dismiss={dismiss} />
    </div>
  )
}
