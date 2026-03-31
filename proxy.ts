import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh the session — required for @supabase/ssr
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  const isProtected =
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/weight') ||
    pathname.startsWith('/diet') ||
    pathname.startsWith('/workout') ||
    pathname.startsWith('/products') ||
    pathname.startsWith('/recipes') ||
    pathname.startsWith('/log')

  // Redirect unauthenticated users away from protected routes
  if (!user && isProtected) {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  // Redirect authenticated users away from the login page
  // Use the user's preferred landing page from their settings
  if (user && pathname === '/') {
    const { data: prefs } = await supabase
      .from('user_body_stats' as never)
      .select('landing_page')
      .eq('user_id', user.id)
      .maybeSingle()

    const landingPage = (prefs as { landing_page?: string } | null)?.landing_page ?? '/dashboard'

    const url = request.nextUrl.clone()
    url.pathname = landingPage
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
