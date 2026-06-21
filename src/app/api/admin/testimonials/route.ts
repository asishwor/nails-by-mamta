import { prisma } from '@/utils/prisma'
import { getUserSession } from '@/lib/session'
import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  try {
    const session = await getUserSession(req)
    if (!session || (session.user as any).role !== 'ADMIN') {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const testimonials = await prisma.testimonial.findMany({
      orderBy: { createdAt: 'desc' }
    })
    return NextResponse.json({ testimonials })
  } catch (error) {
    console.error('Error fetching testimonials:', error)
    return NextResponse.json({ error: 'Failed to fetch testimonials' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await getUserSession(req)
    if (!session || (session.user as any).role !== 'ADMIN') {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const body = await req.json()
    const { contentEn, contentNp, authorName, authorInitial, isActive } = body

    if (!contentEn || !authorName || !authorInitial) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const testimonial = await prisma.testimonial.create({
      data: {
        contentEn,
        contentNp,
        authorName,
        authorInitial,
        isActive: isActive !== undefined ? isActive : true
      }
    })

    return NextResponse.json({ testimonial })
  } catch (error) {
    console.error('Error creating testimonial:', error)
    return NextResponse.json({ error: 'Failed to create testimonial' }, { status: 500 })
  }
}
