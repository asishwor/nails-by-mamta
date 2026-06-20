import { NextResponse } from 'next/server'
import { prisma } from '@/utils/prisma'
import { parse, addMinutes } from 'date-fns'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const status = searchParams.get('status')

    const whereClause: any = {}
    if (status && status !== 'ALL') {
      whereClause.status = status
    }

    const totalCount = await prisma.booking.count({ where: whereClause })
    const totalPages = Math.ceil(totalCount / limit)

    const bookings = await prisma.booking.findMany({
      where: whereClause,
      orderBy: { startTime: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        user: true,
        service: true
      }
    })

    return NextResponse.json({ 
      bookings,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages
      }
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, email, phone, address, serviceId, date, time } = body

    if (!name || !email || !serviceId || !date || !time) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const service = await prisma.service.findUnique({
      where: { id: serviceId }
    })

    if (!service) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 })
    }

    const startTimeStr = `${date} ${time}:00`
    const startTime = parse(startTimeStr, 'yyyy-MM-dd HH:mm:ss', new Date())
    const endTime = addMinutes(startTime, service.durationMinutes)

    let user = await prisma.user.findUnique({ where: { email } })

    if (!user) {
      user = await prisma.user.create({
        data: { name, email, phone, address }
      })
    }

    // Admin manual booking bypasses overlap checks
    const booking = await prisma.booking.create({
      data: {
        userId: user.id,
        serviceId: service.id,
        startTime,
        endTime,
        status: 'CONFIRMED' // Admin booked is usually confirmed automatically
      },
      include: {
        user: true,
        service: true
      }
    })

    return NextResponse.json({ booking }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
