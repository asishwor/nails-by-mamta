import { authOptions } from './auth'
import { getServerSession } from 'next-auth/next'
import { getToken } from 'next-auth/jwt'
import { NextRequest } from 'next/server'

export async function getUserSession(req?: Request | NextRequest) {
  // First try to get session from cookies (Web)
  const session = await getServerSession(authOptions)
  if (session?.user) {
    return session
  }

  // If no session from cookies, try to get JWT token from headers (Mobile / Bearer token)
  if (req) {
    try {
      // @ts-ignore - NextAuth types are sometimes strict about req type
      const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET || "fallback_secret_for_development_change_in_production" })
      if (token) {
        return {
          user: {
            id: token.id,
            role: token.role,
            email: token.email,
            name: token.name,
          }
        }
      }
    } catch (error) {
      console.error('Error parsing token:', error)
    }
  }

  return null
}
