import { NextResponse } from 'next/server'
import { prisma } from '@/utils/prisma'
import { addMinutes, parse, format, isBefore, isAfter, startOfDay, endOfDay, getDay } from 'date-fns'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const dateStr = searchParams.get('date')
  const serviceId = searchParams.get('serviceId')

  if (!dateStr || !serviceId) {
    return NextResponse.json({ error: 'Missing date or serviceId' }, { status: 400 })
  }

  try {
    // 1. Fetch Service Details
    const service = await prisma.service.findUnique({
      where: { id: serviceId },
      select: { durationMinutes: true }
    })

    if (!service) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 })
    }

    // 2. Fetch Admin Settings
    const settings = await prisma.adminSettings.findFirst()

    if (!settings) {
      return NextResponse.json({ error: 'Admin settings not found' }, { status: 500 })
    }

    const selectedDate = parse(dateStr, 'yyyy-MM-dd', new Date())
    const dayOfWeek = getDay(selectedDate) // 0 (Sun) to 6 (Sat)

    const weeklySchedule: any = settings.weeklySchedule || {}
    const dayConfig = weeklySchedule[dayOfWeek.toString()]

    // Check if the business is open on this day
    if (dayConfig) {
      if (!dayConfig.isActive) {
        return NextResponse.json({ slots: [] }) // Closed
      }
    } else if (!settings.workingDays.includes(dayOfWeek)) {
      return NextResponse.json({ slots: [] }) // Closed (fallback)
    }

    const startTimeStr = dayConfig ? dayConfig.startTime : settings.startTime
    const endTimeStr = dayConfig ? dayConfig.endTime : settings.endTime

    // 3. Fetch Existing Bookings for the day
    const dayStart = startOfDay(selectedDate)
    const dayEnd = endOfDay(selectedDate)

    const existingBookings = await prisma.booking.findMany({
      where: {
        startTime: { gte: dayStart },
        endTime: { lte: dayEnd },
        status: { not: 'CANCELLED' }
      },
      select: {
        startTime: true,
        endTime: true
      }
    })

    // 4. Generate & Filter Time Slots
    const availableSlots: string[] = []
    
    // Parse business hours
    const businessStart = parse(`${dateStr} ${startTimeStr}`, 'yyyy-MM-dd HH:mm:ss', new Date())
    const businessEnd = parse(`${dateStr} ${endTimeStr}`, 'yyyy-MM-dd HH:mm:ss', new Date())
    
    const requiredDuration = service.durationMinutes + settings.bufferTimeMinutes
    const slotInterval = 15 // Check every 15 minutes

    let currentSlotStart = businessStart
    const now = new Date()

    while (isBefore(currentSlotStart, businessEnd)) {
      const currentSlotEnd = addMinutes(currentSlotStart, requiredDuration)

      // Skip if slot ends after business closes
      if (isAfter(currentSlotEnd, businessEnd)) {
        break
      }

      // Skip if slot is in the past
      if (isBefore(currentSlotStart, now)) {
        currentSlotStart = addMinutes(currentSlotStart, slotInterval)
        continue
      }

      // Check for overlap with existing bookings
      let isOverlapping = false
      for (const booking of existingBookings) {
        // Overlap condition:
        // (SlotStart < BookingEnd) AND (SlotEnd > BookingStart)
        if (isBefore(currentSlotStart, booking.endTime) && isAfter(currentSlotEnd, booking.startTime)) {
          isOverlapping = true
          break
        }
      }

      if (!isOverlapping) {
        availableSlots.push(format(currentSlotStart, 'HH:mm'))
      }

      currentSlotStart = addMinutes(currentSlotStart, slotInterval)
    }

    return NextResponse.json({ slots: availableSlots })

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
