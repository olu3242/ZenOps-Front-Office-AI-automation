import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockSelect = vi.fn()
const mockFrom = vi.fn(() => ({ select: mockSelect }))
vi.mock('@/lib/supabase', () => ({ supabase: { from: mockFrom } }))
vi.mock('@/lib/pagination', () => ({ PAGE_SIZE: 25 }))

describe('fetchLeadsPaged', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns hasMore=false when fewer rows than limit', async () => {
    const rows = [{ id: '1', business_name: 'Acme', status: 'new', created_at: '2026-01-01T00:00:00Z' }]
    mockSelect.mockReturnValue({
      order: () => ({ limit: () => ({ data: rows, error: null }) }),
    })
    const { fetchLeadsPaged } = await import('@/lib/leads/adapter')
    const result = await fetchLeadsPaged({ limit: 25 })
    expect(result.hasMore).toBe(false)
    expect(result.data).toHaveLength(1)
    expect(result.nextCursor).toBeNull()
  })

  it('returns nextCursor when rows === limit', async () => {
    const rows = Array.from({ length: 25 }, (_, i) => ({
      id: String(i), business_name: `Biz ${i}`, status: 'new', created_at: `2026-01-${String(i + 1).padStart(2, '0')}T00:00:00Z`,
    }))
    mockSelect.mockReturnValue({
      order: () => ({ limit: () => ({ data: rows, error: null }) }),
    })
    const { fetchLeadsPaged } = await import('@/lib/leads/adapter')
    const result = await fetchLeadsPaged({ limit: 25 })
    expect(result.hasMore).toBe(true)
    expect(result.nextCursor).toBe(rows[24].created_at)
  })
})
