import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const pathname = req.nextUrl.pathname

    // Location-based blocking for bookings to prevent false bookings
    if (pathname.startsWith('/api/bookings') && req.method === 'POST') {
      const country = req.headers.get('x-vercel-ip-country')
      // Only block if we have a country header and it's not NP (Nepal)
      if (country && country !== 'NP') {
        return NextResponse.json({ error: 'Bookings are currently only available from Nepal' }, { status: 403 })
      }
    }

    if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
      if (token?.role !== 'ADMIN') {
        if (pathname.startsWith('/api')) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
        return NextResponse.redirect(new URL('/login', req.url))
      }
    }
  },
  {
    callbacks: {
      authorized: ({ req, token }) => {
        const pathname = req.nextUrl.pathname
        // Bookings API does not require admin authentication in middleware
        if (pathname.startsWith('/api/bookings')) {
          return true
        }
        return !!token
      },
    },
    pages: {
      signIn: '/login',
    },
    secret: process.env.NEXTAUTH_SECRET
  }
)

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*', '/api/bookings/:path*']
}
