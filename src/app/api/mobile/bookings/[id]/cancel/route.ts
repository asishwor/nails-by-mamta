import { NextResponse, NextRequest } from 'next/server'
import { prisma } from '@/utils/prisma'
import jwt from 'jsonwebtoken'

const SECRET = process.env.NEXTAUTH_SECRET || 'fallback_secret_for_development_change_in_production'

function getUserFromToken(req: NextRequest) {
  const auth = req.headers.get('authorization')
  if (!auth?.startsWith('Bearer ')) return null
  try {
    return jwt.verify(auth.slice(7), SECRET) as { id: string }
  } catch {
    return null
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const tokenUser = getUserFromToken(req)
  if (!tokenUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { reason } = await req.json()
    if (!reason || reason.trim().length === 0) {
      return NextResponse.json({ error: 'Cancellation reason is required' }, { status: 400 })
    }

    const { id: bookingId } = await params
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId }
    })

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    if (booking.userId !== tokenUser.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (booking.status !== 'PENDING') {
      return NextResponse.json({ error: 'Only pending bookings can be cancelled. Please contact support.' }, { status: 400 })
    }

    const updated = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: 'CANCELLED',
        cancelReason: reason.trim()
      },
      include: { service: true }
    })

    return NextResponse.json({ booking: updated })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
