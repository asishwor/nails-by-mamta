import { NextResponse } from 'next/server'
import { prisma } from '@/utils/prisma'
import bcrypt from 'bcryptjs'
import { getUserSession } from '@/lib/session'

export async function PUT(request: Request) {
  try {
    const session = await getUserSession(request)
    if (!session || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { currentPassword, newPassword } = await request.json()

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: 'Missing passwords' }, { status: 400 })
    }

    if (!session.user?.email) {
      return NextResponse.json({ error: 'User email not found' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user || !user.passwordHash) {
      return NextResponse.json({ error: 'Account not configured with password' }, { status: 400 })
    }

    const isValid = await bcrypt.compare(currentPassword, user.passwordHash)
    if (!isValid) {
      return NextResponse.json({ error: 'Incorrect current password' }, { status: 401 })
    }

    const newHash = await bcrypt.hash(newPassword, 10)

    await prisma.user.update({
      where: { email: session.user.email },
      data: { passwordHash: newHash }
    })

    return NextResponse.json({ success: true })

  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to update password' }, { status: 500 })
  }
}
