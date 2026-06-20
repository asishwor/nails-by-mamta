import { NextResponse } from 'next/server'
import { prisma } from '@/utils/prisma'
import { subDays, startOfDay, format } from 'date-fns'

export async function GET() {
  try {
    const totalBookings = await prisma.booking.count()
    const totalServices = await prisma.service.count()
    const totalUsers = await prisma.user.count()
    
    // Guests are users who don't have a passwordHash and don't have OAuth accounts
    const guestUsers = await prisma.user.count({
      where: {
        passwordHash: null,
        accounts: { none: {} }
      }
    })

    const completedBookings = await prisma.booking.count({ where: { status: 'COMPLETED' } })
    const cancelledBookings = await prisma.booking.count({ where: { status: 'CANCELLED' } })

    // Generate chart data for the last 14 days
    const chartData = []
    for (let i = 13; i >= 0; i--) {
      const date = startOfDay(subDays(new Date(), i))
      const nextDate = startOfDay(subDays(new Date(), i - 1))
      
      const count = await prisma.booking.count({
        where: {
          createdAt: {
            gte: date,
            lt: nextDate
          }
        }
      })
      
      chartData.push({
        date: format(date, 'MMM dd'),
        bookings: count
      })
    }

    const data = {
      totalBookings,
      totalServices,
      totalUsers,
      guestUsers,
      completedBookings,
      cancelledBookings,
      chartData
    }

    return NextResponse.json({ data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
