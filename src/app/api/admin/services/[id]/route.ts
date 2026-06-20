import { NextResponse } from 'next/server'
import { prisma } from '@/utils/prisma'

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const body = await request.json()
    const { name, description, price, durationMinutes, imageUrl, isActive } = body

    const service = await prisma.service.update({
      where: { id },
      data: { name, description, price, durationMinutes, imageUrl, isActive }
    })

    return NextResponse.json({ service })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;

    try {
      // Attempt hard delete first
      await prisma.service.delete({
        where: { id }
      })
      return NextResponse.json({ success: true })
    } catch (dbError: any) {
      // P2003 is the Prisma error code for Foreign Key Constraint Failed
      if (dbError.code === 'P2003') {
        // Fallback to soft delete
        await prisma.service.update({
          where: { id },
          data: { isActive: false }
        })
        return NextResponse.json({
          success: true,
          deactivated: true,
          message: 'Service has existing bookings, so it was deactivated instead of deleted.'
        })
      }
      throw dbError; // Rethrow if it's a different error
    }

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
