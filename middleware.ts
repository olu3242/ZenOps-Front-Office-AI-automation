import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export async function middleware(request: NextRequest) {
  // Fail fast with a clear message if env vars are missing (misconfigured deploy)
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error(
      '[middleware] NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY ' +
      'must be set. Add them to .env.local.'
    )
    return new NextResponse('Server misconfiguration: auth unavailable.', { status: 500 })
  }

  // Build a mutable response so @supabase/ssr can refresh session cookies
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    SUPABASE_URL,
    SUPABASE_KEY,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          // Write refreshed cookies to both the forwarded request and response
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // getUser() verifies the JWT with the Supabase Auth server (more secure than
  // getSession() which only reads the cookie without verification).
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    const signInUrl = new URL('/auth/signin', request.url)
    signInUrl.searchParams.set('next', request.nextUrl.pathname)
    return NextResponse.redirect(signInUrl)
  }

  const path = request.nextUrl.pathname
  const isOpsRoute = path.startsWith('/ops') || path.startsWith('/automation')

  if (isOpsRoute) {
    const { data: subData } = await supabase
      .from('subscriptions')
      .select('status, trial_ends_at')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (subData) {
      const expired = subData.status === 'trialing' && subData.trial_ends_at && new Date(subData.trial_ends_at) < new Date()
      const inactive = ['canceled', 'unpaid'].includes(subData.status)
      if ((expired || inactive) && !path.startsWith('/billing')) {
        return NextResponse.redirect(new URL('/billing', request.url))
      }
    }
  }

  return response
}

export const config = {
  matcher: ['/ops/:path*', '/automation/:path*', '/billing/:path*'],
}
