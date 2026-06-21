import { NextResponse } from 'next/server'
import { prisma } from '@/utils/prisma'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    // Fetch all users with their bookings
    const users = await prisma.user.findMany({
      where: { role: 'USER' },
      include: {
        bookings: {
          include: { service: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    })

    const totalCount = await prisma.user.count({ where: { role: 'USER' } })

    // Map to include calculated stats
    const customers = users.map(user => {
      const totalBookings = user.bookings.length
      const completedBookings = user.bookings.filter(b => b.status === 'COMPLETED').length
      const cancelledBookings = user.bookings.filter(b => b.status === 'CANCELLED').length
      const pendingBookings = user.bookings.filter(b => b.status === 'PENDING').length
      const confirmedBookings = user.bookings.filter(b => b.status === 'CONFIRMED').length

      // Calculate revenue (only from completed bookings)
      const totalRevenue = user.bookings
        .filter(b => b.status === 'COMPLETED')
        .reduce((sum, b) => sum + (b.service?.price || 0), 0)

      // Calculate loyalty/trust score
      let trustLabel = 'New'
      if (totalBookings >= 3 && cancelledBookings === 0) {
        trustLabel = 'Loyal'
      } else if (totalBookings > 0 && cancelledBookings / totalBookings > 0.5) {
        trustLabel = 'High Cancellation'
      } else if (totalBookings > 0) {
        trustLabel = 'Regular'
      }

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        createdAt: user.createdAt,
        stats: {
          total: totalBookings,
          completed: completedBookings,
          cancelled: cancelledBookings,
          pending: pendingBookings,
          confirmed: confirmedBookings,
          revenue: totalRevenue
        },
        trustLabel
      }
    })

    return NextResponse.json({
      customers,
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit)
      }
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
