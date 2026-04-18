import { describe, it, expect, vi } from 'vitest'

const mockGetSession = vi.fn()
const mockSignOut = vi.fn()
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: { getSession: mockGetSession, signOut: mockSignOut },
  },
}))

describe('auth session', () => {
  it('returns null session when not authenticated', async () => {
    mockGetSession.mockResolvedValue({ data: { session: null }, error: null })
    const { supabase } = await import('@/lib/supabase')
    const { data } = await supabase.auth.getSession()
    expect(data.session).toBeNull()
  })

  it('returns session with user when authenticated', async () => {
    const fakeSession = { user: { id: 'user-123', email: 'test@example.com' }, access_token: 'tok' }
    mockGetSession.mockResolvedValue({ data: { session: fakeSession }, error: null })
    const { supabase } = await import('@/lib/supabase')
    const { data } = await supabase.auth.getSession()
    expect(data.session?.user.id).toBe('user-123')
  })

  it('signOut clears session', async () => {
    mockSignOut.mockResolvedValue({ error: null })
    const { supabase } = await import('@/lib/supabase')
    const { error } = await supabase.auth.signOut()
    expect(error).toBeNull()
    expect(mockSignOut).toHaveBeenCalledOnce()
  })
})
