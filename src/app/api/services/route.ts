import { NextResponse } from 'next/server'
import { prisma } from '@/utils/prisma'

export async function GET() {
  try {
    const services = await prisma.service.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        description: true,
        descriptionNp: true,
        price: true,
        durationMinutes: true,
        imageUrl: true,
        isActive: true,
      },
      orderBy: { name: 'asc' }
    })
    return NextResponse.json({ services })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
