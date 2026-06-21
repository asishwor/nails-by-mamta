import { prisma } from '@/utils/prisma'
import { getUserSession } from '@/lib/session'
import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  try {
    const session = await getUserSession(req)
    if (!session || (session.user as any).role !== 'ADMIN') return new NextResponse('Unauthorized', { status: 401 })

    const keys = await prisma.apiKey.findMany({
      orderBy: { createdAt: 'desc' }
    })
    return NextResponse.json({ keys })
  } catch (error) {
    console.error(error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await getUserSession(req)
    if (!session || (session.user as any).role !== 'ADMIN') return new NextResponse('Unauthorized', { status: 401 })

    const { id, provider, key, models, isActive } = await req.json()

    if (id) {
      // Update
      const updated = await prisma.apiKey.update({
        where: { id },
        data: { provider, key, models, isActive }
      })
      return NextResponse.json({ key: updated })
    } else {
      // Create
      const newKey = await prisma.apiKey.create({
        data: { provider, key, models, isActive }
      })
      return NextResponse.json({ key: newKey })
    }
  } catch (error) {
    console.error(error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getUserSession(req)
    if (!session || (session.user as any).role !== 'ADMIN') return new NextResponse('Unauthorized', { status: 401 })

    const url = new URL(req.url)
    const id = url.searchParams.get('id')
    if (!id) return new NextResponse('Missing ID', { status: 400 })

    await prisma.apiKey.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}
