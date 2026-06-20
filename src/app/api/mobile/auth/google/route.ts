import { NextResponse } from 'next/server'
import { prisma } from '@/utils/prisma'
import jwt from 'jsonwebtoken'

const SECRET = process.env.NEXTAUTH_SECRET || 'fallback_secret_for_development_change_in_production'

// POST /api/mobile/auth/google
// Accepts a Google ID token from the mobile app, verifies it via Google's tokeninfo endpoint,
// then finds/creates the user and returns our own JWT — compatible with the NextAuth session model.
export async function POST(request: Request) {
  try {
    const { idToken } = await request.json()

    if (!idToken) {
      return NextResponse.json({ error: 'Missing Google ID token' }, { status: 400 })
    }

    // Verify the Google ID token with Google's tokeninfo endpoint
    const googleRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`)
    if (!googleRes.ok) {
      return NextResponse.json({ error: 'Invalid Google token' }, { status: 401 })
    }

    const googleUser = await googleRes.json()

    if (!googleUser.email) {
      return NextResponse.json({ error: 'No email from Google' }, { status: 401 })
    }

    // Find or create user
    let user = await prisma.user.findUnique({ where: { email: googleUser.email } })

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: googleUser.email,
          name: googleUser.name || googleUser.email.split('@')[0],
          image: googleUser.picture || null,
          emailVerified: new Date(),
        }
      })
    } else {
      // Update image if missing
      if (!user.image && googleUser.picture) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { image: googleUser.picture, emailVerified: user.emailVerified ?? new Date() }
        })
      }
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      SECRET,
      { expiresIn: '30d' }
    )

    return NextResponse.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role, image: user.image, phone: user.phone, address: user.address }
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
