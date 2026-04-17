'use client'

import { useEffect, useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  fetchAutomationRules,
  createAutomationRule,
  updateAutomationRule,
  toggleRuleActive,
  deleteAutomationRule,
  type CreateRulePayload,
} from '@/lib/automation/adapter'
import {
  summarizeCondition,
  summarizeActions,
  ENTITY_LABELS,
  TRIGGER_LABELS,
} from '@/lib/automation/types'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/useToast'
import { ToastContainer } from '@/components/ui/Toast'
import { RuleBuilder } from '@/components/automation/RuleBuilder'
import type { AutomationRule } from '@/lib/automation/types'

export default function AutomationPage() {
  const router = useRouter()
  const { toasts, addToast, dismiss } = useToast()

  const [rules, setRules]                     = useState<AutomationRule[]>([])
  const [loading, setLoading]                 = useState(true)
  const [error, setError]                     = useState<string | null>(null)
  const [showBuilder, setShowBuilder]         = useState(false)
  const [editingRule, setEditingRule]         = useState<AutomationRule | null>(null)
  const [saving, setSaving]                   = useState(false)
  const [togglingId, setTogglingId]           = useState<string | null>(null)
  const [deletingId, setDeletingId]           = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [signingOut, setSigningOut]           = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setRules(await fetchAutomationRules())
    } catch {
      setError('Failed to load automation rules.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const handleSignOut = useCallback(async () => {
    setSigningOut(true)
    const { error } = await supabase.auth.signOut()
    if (error) { setSigningOut(false); return }
    router.push('/auth/signin')
  }, [router])

  // ---- Create / Edit ----
  const handleSave = useCallback(async (payload: CreateRulePayload) => {
    setSaving(true)
    try {
      if (editingRule) {
        const updated = await updateAutomationRule(editingRule.id, payload)
        setRules((prev) => prev.map((r) => r.id === editingRule.id ? updated : r))
        addToast('Rule updated', 'success')
      } else {
        const created = await createAutomationRule(payload)
        setRules((prev) => [created, ...prev])
        addToast('Rule created', 'success')
      }
      setShowBuilder(false)
      setEditingRule(null)
    } catch {
      addToast('Failed to save rule', 'error')
    } finally {
      setSaving(false)
    }
  }, [editingRule, addToast])

  // ---- Toggle active ----
  const handleToggle = useCallback(async (rule: AutomationRule) => {
    setTogglingId(rule.id)
    const next = !rule.is_active
    setRules((prev) => prev.map((r) => r.id === rule.id ? { ...r, is_active: next } : r))
    try {
      await toggleRuleActive(rule.id, next)
    } catch {
      setRules((prev) => prev.map((r) => r.id === rule.id ? { ...r, is_active: rule.is_active } : r))
      addToast('Failed to update rule status', 'error')
    } finally {
      setTogglingId(null)
    }
  }, [addToast])

  // ---- Delete ----
  const handleDelete = useCallback(async (id: string) => {
    setDeletingId(id)
    setConfirmDeleteId(null)
    try {
      await deleteAutomationRule(id)
      setRules((prev) => prev.filter((r) => r.id !== id))
      addToast('Rule deleted', 'info')
    } catch {
      addToast('Failed to delete rule', 'error')
    } finally {
      setDeletingId(null)
    }
  }, [addToast])

  const openCreate = () => { setEditingRule(null); setShowBuilder(true) }
  const openEdit   = (r: AutomationRule) => { setEditingRule(r); setShowBuilder(true) }
  const closeBuilder = () => { setShowBuilder(false); setEditingRule(null) }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-gray-900">Automation Rules</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              If/then rules — triggered by entity status changes
            </p>
          </div>
          <div className="flex items-center gap-4">
            <a href="/ops/audits"   className="text-sm text-blue-600 hover:underline">Audits</a>
            <a href="/ops/leads"    className="text-sm text-blue-600 hover:underline">Leads</a>
            <a href="/ops/tasks"    className="text-sm text-blue-600 hover:underline">Tasks</a>
            <a href="/ops/outreach" className="text-sm text-blue-600 hover:underline">Outreach</a>
            <button
              onClick={handleSignOut}
              disabled={signingOut}
              className="text-sm text-gray-400 hover:text-gray-600 disabled:opacity-50 transition-colors"
            >
              {signingOut ? 'Signing out…' : 'Sign out'}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">

        {/* Toolbar */}
        <div className="flex items-center justify-between mb-5">
          <p className="text-sm text-gray-500">
            {!loading && `${rules.length} rule${rules.length !== 1 ? 's' : ''} configured`}
          </p>
          <button
            onClick={openCreate}
            className="text-sm bg-gray-900 text-white rounded-md px-4 py-2 font-medium hover:bg-gray-700 transition-colors"
          >
            + Create Rule
          </button>
        </div>

        {loading && (
          <div className="py-16 text-center text-sm text-gray-400">Loading…</div>
        )}

        {error && !loading && (
          <div className="py-10 text-center">
            <p className="text-sm text-red-600">{error}</p>
            <button onClick={load} className="mt-3 text-sm text-blue-600 hover:underline">Retry</button>
          </div>
        )}

        {!loading && !error && rules.length === 0 && (
          <div className="py-16 text-center">
            <p className="text-sm text-gray-400">No automation rules yet.</p>
            <button
              onClick={openCreate}
              className="mt-3 text-sm text-blue-600 hover:underline"
            >
              Create your first rule →
            </button>
          </div>
        )}

        {!loading && !error && rules.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left px-4 py-3 font-medium text-gray-600 w-24">Entity</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 w-32">Trigger</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Condition</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Actions</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 w-24">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 w-28"></th>
                </tr>
              </thead>
              <tbody>
                {rules.map((r, i) => (
                  <tr
                    key={r.id}
                    className={`border-b border-gray-100 last:border-0 ${i % 2 !== 0 ? 'bg-gray-50/40' : ''} ${!r.is_active ? 'opacity-50' : ''}`}
                  >
                    {/* Entity */}
                    <td className="px-4 py-3">
                      <span className="text-xs font-medium bg-gray-100 text-gray-700 rounded px-2 py-0.5 capitalize">
                        {ENTITY_LABELS[r.entity_type]}
                      </span>
                    </td>

                    {/* Trigger */}
                    <td className="px-4 py-3 text-gray-600 text-xs">
                      {TRIGGER_LABELS[r.trigger_event]}
                    </td>

                    {/* Condition summary */}
                    <td className="px-4 py-3 text-gray-700">
                      {summarizeCondition(r)}
                    </td>

                    {/* Action summary */}
                    <td className="px-4 py-3 text-gray-500 text-xs max-w-xs">
                      {summarizeActions(r.actions)}
                    </td>

                    {/* Active toggle */}
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleToggle(r)}
                        disabled={togglingId === r.id}
                        aria-label={r.is_active ? 'Deactivate rule' : 'Activate rule'}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none disabled:opacity-50 ${r.is_active ? 'bg-teal-600' : 'bg-gray-300'}`}
                      >
                        <span
                          className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${r.is_active ? 'translate-x-4' : 'translate-x-1'}`}
                        />
                      </button>
                    </td>

                    {/* Edit / Delete */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => openEdit(r)}
                          className="text-xs text-blue-600 hover:underline"
                        >
                          Edit
                        </button>

                        {confirmDeleteId === r.id ? (
                          <span className="flex items-center gap-1.5">
                            <button
                              onClick={() => handleDelete(r.id)}
                              disabled={deletingId === r.id}
                              className="text-xs text-red-600 hover:underline disabled:opacity-50"
                            >
                              {deletingId === r.id ? 'Deleting…' : 'Confirm'}
                            </button>
                            <button
                              onClick={() => setConfirmDeleteId(null)}
                              className="text-xs text-gray-400 hover:text-gray-600"
                            >
                              Cancel
                            </button>
                          </span>
                        ) : (
                          <button
                            onClick={() => setConfirmDeleteId(r.id)}
                            className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="px-4 py-2.5 border-t border-gray-100 text-xs text-gray-400">
              {rules.filter((r) => r.is_active).length} active ·{' '}
              {rules.filter((r) => !r.is_active).length} inactive
            </div>
          </div>
        )}
      </div>

      {/* Rule Builder Modal */}
      {showBuilder && (
        <RuleBuilder
          initial={editingRule ?? undefined}
          saving={saving}
          onSave={handleSave}
          onClose={closeBuilder}
        />
      )}

      <ToastContainer toasts={toasts} dismiss={dismiss} />
    </div>
  )
}
