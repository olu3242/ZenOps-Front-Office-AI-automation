import { createBrowserClient } from '@supabase/ssr'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!url || !key) {
  throw new Error(
    'Missing Supabase env vars. Add NEXT_PUBLIC_SUPABASE_URL and ' +
    'NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local'
  )
}

// createBrowserClient stores the session in cookies (not localStorage)
// so Next.js middleware can read it server-side for route protection.
export const supabase = createBrowserClient(url, key)
