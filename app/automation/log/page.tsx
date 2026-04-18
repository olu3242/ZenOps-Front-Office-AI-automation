'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

interface EventRow {
  id: string
  entity_type: string
  entity_id: string
  event_type: string
  payload: Record<string, unknown>
  created_at: string
  executions: ExecutionRow[]
}

interface ExecutionRow {
  id: string
  rule_id: string
  status: 'running' | 'success' | 'failed' | 'skipped'
  error_detail: string | null
  created_at: string
}

const STATUS_COLORS = {
  success: 'bg-teal-50 text-teal-700',
  failed:  'bg-red-50 text-red-600',
  skipped: 'bg-gray-100 text-gray-500',
  running: 'bg-blue-50 text-blue-600',
}

export default function AutomationLogPage() {
  const [events, setEvents] = useState<EventRow[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const { data: evts } = await supabase
      .from('automation_events')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50)

    if (!evts) { setLoading(false); return }

    const { data: execs } = await supabase
      .from('automation_executions')
      .select('*')
      .in('event_id', evts.map(e => e.id))
      .order('created_at', { ascending: false })

    const execsByEvent = (execs ?? []).reduce<Record<string, ExecutionRow[]>>((acc, ex) => {
      ;(acc[ex.event_id] ??= []).push(ex as ExecutionRow)
      return acc
    }, {})

    setEvents(evts.map(e => ({ ...e, payload: e.payload ?? {}, executions: execsByEvent[e.id] ?? [] })))
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-gray-900">Automation Log</h1>
            <p className="text-sm text-gray-500 mt-0.5">Recent events and rule executions</p>
          </div>
          <div className="flex items-center gap-4">
            <a href="/automation" className="text-sm text-blue-600 hover:underline">Rules</a>
            <a href="/ops" className="text-sm text-blue-600 hover:underline">Dashboard</a>
            <button onClick={load} className="text-sm text-gray-400 hover:text-gray-600">Refresh</button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        {loading && <div className="py-16 text-center text-sm text-gray-400">Loading...</div>}
        {!loading && events.length === 0 && (
          <div className="py-16 text-center text-sm text-gray-400">No automation events yet.</div>
        )}
        {!loading && events.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Time</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Entity</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Event</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Executions</th>
                  <th className="px-4 py-3 w-6"></th>
                </tr>
              </thead>
              <tbody>
                {events.map((e, i) => (
                  <>
                    <tr
                      key={e.id}
                      onClick={() => setExpandedId(expandedId === e.id ? null : e.id)}
                      className={`border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${i % 2 !== 0 ? 'bg-gray-50/50' : ''}`}
                    >
                      <td className="px-4 py-3 text-gray-500 tabular-nums whitespace-nowrap">
                        {new Date(e.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs font-medium bg-gray-100 text-gray-700 rounded px-2 py-0.5 capitalize">{e.entity_type}</span>
                        <span className="ml-2 text-xs text-gray-400 font-mono">{e.entity_id.slice(0, 8)}</span>
                      </td>
                      <td className="px-4 py-3 text-gray-700 capitalize">{e.event_type.replace(/_/g, ' ')}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1.5 flex-wrap">
                          {e.executions.length === 0
                            ? <span className="text-xs text-gray-400">no rules matched</span>
                            : e.executions.map(ex => (
                              <span key={ex.id} className={`text-xs font-medium rounded px-1.5 py-0.5 ${STATUS_COLORS[ex.status]}`}>
                                {ex.status}
                              </span>
                            ))
                          }
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs">{expandedId === e.id ? '▲' : '▼'}</td>
                    </tr>
                    {expandedId === e.id && (
                      <tr key={`${e.id}-detail`} className="bg-blue-50/20 border-b border-gray-100">
                        <td colSpan={5} className="px-4 py-4 space-y-3">
                          <div>
                            <p className="text-xs text-gray-400 mb-1">Payload</p>
                            <pre className="text-xs text-gray-700 bg-gray-50 rounded p-2 overflow-x-auto">
                              {JSON.stringify(e.payload, null, 2)}
                            </pre>
                          </div>
                          {e.executions.length > 0 && (
                            <div>
                              <p className="text-xs text-gray-400 mb-1">Executions</p>
                              <div className="space-y-1">
                                {e.executions.map(ex => (
                                  <div key={ex.id} className="text-xs flex gap-3 items-start">
                                    <span className={`font-medium rounded px-1.5 py-0.5 shrink-0 ${STATUS_COLORS[ex.status]}`}>{ex.status}</span>
                                    <span className="text-gray-500 font-mono">rule {ex.rule_id.slice(0, 8)}</span>
                                    {ex.error_detail && <span className="text-red-600">{ex.error_detail}</span>}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
            <div className="px-4 py-2.5 border-t border-gray-100 text-xs text-gray-400">
              {events.length} events (last 50)
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
