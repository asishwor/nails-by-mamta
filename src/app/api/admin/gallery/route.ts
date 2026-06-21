import { NextResponse } from 'next/server'
import { prisma } from '@/utils/prisma'
import { getUserSession } from '@/lib/session'

export async function GET(req: Request) {
  try {
    const session = await getUserSession(req)
    if (!session || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const images = await prisma.galleryImage.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    })
    return NextResponse.json({ images })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await getUserSession(req)
    if (!session || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { url, altText } = body

    if (!url) {
      return NextResponse.json({ error: 'Image URL is required' }, { status: 400 })
    }

    const image = await prisma.galleryImage.create({
      data: {
        url,
        altText
      }
    })

    return NextResponse.json({ image })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getUserSession(req)
    if (!session || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Image ID is required' }, { status: 400 })
    }

    await prisma.galleryImage.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
