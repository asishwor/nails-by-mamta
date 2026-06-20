import { NextResponse } from 'next/server'
import { prisma } from '@/utils/prisma'
import jwt from 'jsonwebtoken'
import { NextRequest } from 'next/server'

const SECRET = process.env.NEXTAUTH_SECRET || 'fallback_secret_for_development_change_in_production'

// Helper to extract user from Bearer token
function getUserFromToken(req: NextRequest) {
  const auth = req.headers.get('authorization')
  if (!auth?.startsWith('Bearer ')) return null
  try {
    return jwt.verify(auth.slice(7), SECRET) as { id: string; email: string; role: string }
  } catch {
    return null
  }
}

// GET /api/mobile/user — get current user profile
export async function GET(req: NextRequest) {
  const tokenUser = getUserFromToken(req)
  if (!tokenUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await prisma.user.findUnique({ where: { id: tokenUser.id } })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  return NextResponse.json({
    user: { id: user.id, name: user.name, email: user.email, role: user.role, image: user.image, phone: user.phone, address: user.address }
  })
}

// PUT /api/mobile/user — update profile
export async function PUT(req: NextRequest) {
  const tokenUser = getUserFromToken(req)
  if (!tokenUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { name, phone, address } = await req.json()

  const user = await prisma.user.update({
    where: { id: tokenUser.id },
    data: { name, phone, address }
  })

  return NextResponse.json({
    user: { id: user.id, name: user.name, email: user.email, role: user.role, image: user.image, phone: user.phone, address: user.address }
  })
}
