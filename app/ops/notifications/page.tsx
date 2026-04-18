'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

interface Notification {
  id: string
  entity_type: string
  entity_id: string
  message: string
  created_at: string
  read: boolean
}

export default function NotificationsPage() {
  const [items, setItems] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('automation_events')
      .select('id, entity_type, entity_id, payload, created_at')
      .eq('event_type', 'notification')
      .order('created_at', { ascending: false })
      .limit(100)
    setItems(
      (data ?? []).map(r => ({
        id: r.id,
        entity_type: r.entity_type,
        entity_id: r.entity_id,
        message: (r.payload as { message?: string })?.message ?? '',
        created_at: r.created_at,
        read: false,
      }))
    )
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const ENTITY_HREF: Record<string, string> = {
    audit:    '/ops/audits',
    lead:     '/ops/leads',
    task:     '/ops/tasks',
    outreach: '/ops/outreach',
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-gray-900">Notifications</h1>
            <p className="text-sm text-gray-500 mt-0.5">Automation rule alerts</p>
          </div>
          <div className="flex items-center gap-4">
            <a href="/ops" className="text-sm text-blue-600 hover:underline">Dashboard</a>
            <a href="/automation" className="text-sm text-blue-600 hover:underline">Rules</a>
            <button onClick={load} className="text-sm text-gray-400 hover:text-gray-600">Refresh</button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
        {loading && <div className="py-16 text-center text-sm text-gray-400">Loading...</div>}
        {!loading && items.length === 0 && (
          <div className="py-16 text-center">
            <p className="text-sm text-gray-400">No notifications yet.</p>
            <p className="text-xs text-gray-400 mt-1">Notifications appear when automation rules fire a "Notify" action.</p>
          </div>
        )}
        {!loading && items.length > 0 && (
          <div className="space-y-2">
            {items.map(n => (
              <div key={n.id} className="bg-white border border-gray-200 rounded-lg px-4 py-3 flex items-start gap-3">
                <div className="mt-0.5 w-2 h-2 rounded-full bg-teal-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900">{n.message}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-gray-400 capitalize">{n.entity_type}</span>
                    {ENTITY_HREF[n.entity_type] && (
                      <a href={ENTITY_HREF[n.entity_type]} className="text-xs text-blue-600 hover:underline">
                        View {n.entity_type}s
                      </a>
                    )}
                  </div>
                </div>
                <span className="text-xs text-gray-400 shrink-0 tabular-nums">
                  {new Date(n.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
            <p className="text-xs text-gray-400 text-center pt-2">Showing last 100 notifications</p>
          </div>
        )}
      </div>
    </div>
  )
}
