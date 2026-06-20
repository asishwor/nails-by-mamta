import { NextResponse } from 'next/server'
import { prisma } from '@/utils/prisma'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const cursor = searchParams.get('cursor')
    const limit = parseInt(searchParams.get('limit') || '10')

    const items = await prisma.galleryImage.findMany({
      take: limit + 1, // Fetch one extra to check if there are more pages
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: {
        createdAt: 'desc'
      }
    })

    let nextCursor: typeof cursor | undefined = undefined
    if (items.length > limit) {
      const nextItem = items.pop()
      nextCursor = nextItem?.id
    }

    return NextResponse.json({
      images: items,
      nextCursor
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
