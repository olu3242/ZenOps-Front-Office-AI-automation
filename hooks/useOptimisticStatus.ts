'use client'

import { useState, useCallback, useRef } from 'react'

export interface OptimisticUpdateOptions<T> {
  id: string
  /** Fields to apply immediately in the UI before the server responds */
  optimistic: Partial<T>
  /** Server call — must return the full updated record (with refreshed updated_at) */
  apiCall: () => Promise<T>
  onSuccess?: () => void
  /** Called when the server rejects with a CONCURRENCY_CONFLICT error */
  onConflict?: () => void
  onError?: () => void
}

/**
 * Generic optimistic status hook.
 *
 * Usage:
 *   const { records, setRecords, savingIds, updateStatus } = useOptimisticStatus<MyRecord>([])
 *
 *   // After loading data:
 *   setRecords(serverData)
 *
 *   // On user action:
 *   updateStatus({
 *     id: record.id,
 *     optimistic: { status: newStatus },
 *     apiCall: () => updateMyStatus(record.id, newStatus, record.updated_at),
 *     onSuccess: () => toast('Status updated'),
 *     onConflict: () => toast('Updated by another user — refreshed'),
 *     onError: () => toast('Save failed, reverted'),
 *   })
 */
export function useOptimisticStatus<T extends { id: string }>(initial: T[]) {
  const [records, setRecords] = useState<T[]>(initial)
  const [savingIds, setSavingIds] = useState<Set<string>>(new Set())

  // Keep a ref so updateStatus closes over the latest records without
  // needing to be in the dependency array (avoids stale-closure rollback bugs).
  const recordsRef = useRef(records)
  recordsRef.current = records

  const updateStatus = useCallback(
    async ({ id, optimistic, apiCall, onSuccess, onConflict, onError }: OptimisticUpdateOptions<T>) => {
      const snapshot = recordsRef.current.find((r) => r.id === id)
      if (!snapshot) return

      // Optimistic apply
      setRecords((prev) => prev.map((r) => (r.id === id ? { ...r, ...optimistic } : r)))
      setSavingIds((prev) => new Set(prev).add(id))

      try {
        const updated = await apiCall()
        // Sync the server record so the next save uses the correct updated_at
        setRecords((prev) => prev.map((r) => (r.id === id ? updated : r)))
        onSuccess?.()
      } catch (err) {
        // Rollback to snapshot
        setRecords((prev) => prev.map((r) => (r.id === id ? snapshot : r)))
        if (err instanceof Error && err.message === 'CONCURRENCY_CONFLICT') {
          onConflict?.()
        } else {
          onError?.()
        }
      } finally {
        setSavingIds((prev) => {
          const next = new Set(prev)
          next.delete(id)
          return next
        })
      }
    },
    [] // stable — recordsRef keeps it fresh without re-creating the callback
  )

  return { records, setRecords, savingIds, updateStatus }
}
