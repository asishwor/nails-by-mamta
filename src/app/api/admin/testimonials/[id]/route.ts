import { prisma } from '@/utils/prisma'
import { getUserSession } from '@/lib/session'
import { NextResponse } from 'next/server'

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const session = await getUserSession(req)
    if (!session || (session.user as any).role !== 'ADMIN') {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const { id } = await params
    const body = await req.json()
    const { contentEn, contentNp, authorName, authorInitial, isActive } = body

    const testimonial = await prisma.testimonial.update({
      where: { id },
      data: {
        contentEn,
        contentNp,
        authorName,
        authorInitial,
        isActive
      }
    })

    return NextResponse.json({ testimonial })
  } catch (error) {
    console.error('Error updating testimonial:', error)
    return NextResponse.json({ error: 'Failed to update testimonial' }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const session = await getUserSession(req)
    if (!session || (session.user as any).role !== 'ADMIN') {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const id = resolvedParams.id
    await prisma.testimonial.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting testimonial:', error)
    return NextResponse.json({ error: 'Failed to delete testimonial' }, { status: 500 })
  }
}
