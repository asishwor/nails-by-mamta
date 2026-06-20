import { NextResponse } from 'next/server'
import { prisma } from '@/utils/prisma'
import jwt from 'jsonwebtoken'
import { NextRequest } from 'next/server'
import { parse, addMinutes } from 'date-fns'

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

// GET /api/mobile/bookings — list user's bookings
export async function GET(req: NextRequest) {
  const tokenUser = getUserFromToken(req)
  if (!tokenUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const bookings = await prisma.booking.findMany({
    where: { userId: tokenUser.id },
    include: { service: true },
    orderBy: { startTime: 'desc' }
  })

  return NextResponse.json({ bookings })
}

// POST /api/mobile/bookings — create booking
export async function POST(req: NextRequest) {
  const tokenUser = getUserFromToken(req)
  if (!tokenUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { serviceId, date, time } = await req.json()

    if (!serviceId || !date || !time) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const service = await prisma.service.findUnique({ where: { id: serviceId } })
    if (!service) return NextResponse.json({ error: 'Service not found' }, { status: 404 })

    const startTimeStr = `${date} ${time}:00`
    const startTime = parse(startTimeStr, 'yyyy-MM-dd HH:mm:ss', new Date())
    const endTime = addMinutes(startTime, service.durationMinutes)

    const booking = await prisma.booking.create({
      data: { userId: tokenUser.id, serviceId: service.id, startTime, endTime, status: 'PENDING' },
      include: { service: true }
    })

    return NextResponse.json({ booking }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
