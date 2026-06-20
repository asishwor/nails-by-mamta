import { NextResponse } from 'next/server'
import { prisma } from '@/utils/prisma'
import { parse, addMinutes } from 'date-fns'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, email, phone, address, serviceId, date, time } = body

    if (!name || !email || !serviceId || !date || !time) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // 1. Fetch Service to calculate end time
    const service = await prisma.service.findUnique({
      where: { id: serviceId }
    })

    if (!service) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 })
    }

    // Parse start time and calculate end time
    const startTimeStr = `${date} ${time}:00`
    const startTime = parse(startTimeStr, 'yyyy-MM-dd HH:mm:ss', new Date())
    const endTime = addMinutes(startTime, service.durationMinutes)

    // 2. Find or Create User by Email (Guest Checkout)
    let user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user) {
      user = await prisma.user.create({
        data: {
          name,
          email,
          phone,
          address
        }
      })
    } else {
      // Optionally update phone and address if missing or changed
      user = await prisma.user.update({
        where: { email },
        data: { 
          phone: phone || user.phone,
          address: address || user.address
        }
      })
    }

    // 3. Create Booking
    const booking = await prisma.booking.create({
      data: {
        userId: user.id,
        serviceId: service.id,
        startTime,
        endTime,
        status: 'PENDING'
      }
    })

    return NextResponse.json({ booking }, { status: 201 })

  } catch (error: any) {
    console.error('Booking error:', error)
    return NextResponse.json({ error: error.message || 'Failed to create booking' }, { status: 500 })
  }
}
