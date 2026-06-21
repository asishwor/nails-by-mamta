import { getUserSession } from '@/lib/session'
import { prisma } from '@/utils/prisma'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const session = await getUserSession(req)
    if (!(session?.user as any)?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { lifestyleProfile } = await req.json()

    await prisma.user.update({
      where: { id: (session?.user as any)?.id },
      data: { lifestyleProfile }
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function GET(req: Request) {
  try {
    const session = await getUserSession(req)
    if (!(session?.user as any)?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: (session?.user as any)?.id }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const isProfileComplete = !!user.phone && !!user.address

    return NextResponse.json({
      user,
      isProfileComplete
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getUserSession(req)
    if (!(session?.user as any)?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { name, phone, address } = body

    const user = await prisma.user.update({
      where: { id: (session?.user as any)?.id },
      data: {
        name: name !== undefined ? name : undefined,
        phone: phone !== undefined ? phone : undefined,
        address: address !== undefined ? address : undefined
      }
    })

    return NextResponse.json({ success: true, user })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
