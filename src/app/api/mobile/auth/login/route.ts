import { NextResponse } from 'next/server'
import { prisma } from '@/utils/prisma'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const SECRET = process.env.NEXTAUTH_SECRET || 'fallback_secret_for_development_change_in_production'

// POST /api/mobile/auth/login — email + password
export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'Missing credentials' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { email } })

    if (!user || !user.passwordHash) {
      return NextResponse.json({ error: 'User not found or uses Google sign-in' }, { status: 401 })
    }

    const isValid = await bcrypt.compare(password, user.passwordHash)
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid password' }, { status: 401 })
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
