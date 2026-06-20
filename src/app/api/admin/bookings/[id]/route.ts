import { NextResponse } from 'next/server'
import { prisma } from '@/utils/prisma'

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const body = await request.json()
    const { status } = body

    if (!status) {
      return NextResponse.json({ error: 'Status is required' }, { status: 400 })
    }

    const booking = await prisma.booking.update({
      where: { id },
      data: { status }
    })

    return NextResponse.json({ booking })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
