'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { OpsNav } from '@/components/ui/OpsNav'

interface Notification {
  id: string
  entity_type: string
  entity_id: string
  message: string
  created_at: string
  read: boolean
}

const ENTITY_HREF: Record<string, string> = {
  audit:    '/ops/audits',
  lead:     '/ops/leads',
  task:     '/ops/tasks',
  outreach: '/ops/outreach',
}

export default function NotificationsPage() {
  const [items, setItems] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [readIds, setReadIds] = useState<Set<string>>(new Set())
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

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

  useEffect(() => {
    load()

    channelRef.current = supabase
      .channel('rt-notifications')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'automation_events',
        filter: 'event_type=eq.notification',
      }, payload => {
        const r = payload.new as { id: string; entity_type: string; entity_id: string; payload: { message?: string }; created_at: string }
        setItems(prev => [{
          id: r.id,
          entity_type: r.entity_type,
          entity_id: r.entity_id,
          message: r.payload?.message ?? '',
          created_at: r.created_at,
          read: false,
        }, ...prev])
      })
      .subscribe()

    return () => {
      if (channelRef.current) supabase.removeChannel(channelRef.current)
    }
  }, [load])

  function markRead(id: string) {
    setReadIds(prev => { const s = new Set(prev); s.add(id); return s })
  }

  function markAllRead() {
    setReadIds(new Set<string>(items.map(n => n.id)))
  }

  const unreadCount = items.filter(n => !readIds.has(n.id)).length

  return (
    <div className="min-h-screen bg-gray-50">
      <OpsNav title="Notifications" subtitle="Automation rule alerts" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
        {!loading && items.length > 0 && (
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-500">
              {unreadCount > 0 ? <span className="font-medium text-gray-900">{unreadCount} unread</span> : 'All read'}
            </p>
            {unreadCount > 0 && (
              <button onClick={markAllRead} className="text-xs text-blue-600 hover:underline">Mark all as read</button>
            )}
          </div>
        )}

        {loading && <div className="py-16 text-center text-sm text-gray-400">Loading...</div>}

        {!loading && items.length === 0 && (
          <div className="py-16 text-center">
            <p className="text-sm text-gray-400">No notifications yet.</p>
            <p className="text-xs text-gray-400 mt-1">Notifications appear when automation rules fire a &quot;Notify&quot; action.</p>
          </div>
        )}

        {!loading && items.length > 0 && (
          <div className="space-y-2">
            {items.map(n => {
              const isRead = readIds.has(n.id)
              return (
                <div key={n.id}
                  className={`border rounded-lg px-4 py-3 flex items-start gap-3 transition-colors ${isRead ? 'bg-white border-gray-200 opacity-60' : 'bg-white border-gray-200 shadow-sm'}`}>
                  <button onClick={() => markRead(n.id)} className="mt-1.5 shrink-0" title={isRead ? 'Read' : 'Mark as read'}>
                    <div className={`w-2 h-2 rounded-full transition-colors ${isRead ? 'bg-gray-300' : 'bg-teal-500'}`} />
                  </button>
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
              )
            })}
            <p className="text-xs text-gray-400 text-center pt-2">Showing last 100 notifications · Updates in real-time</p>
          </div>
        )}
      </div>
    </div>
  )
}
