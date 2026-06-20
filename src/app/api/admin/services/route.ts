import { NextResponse } from 'next/server'
import { prisma } from '@/utils/prisma'

export async function GET() {
  try {
    const services = await prisma.service.findMany({ orderBy: { name: 'asc' } })
    return NextResponse.json({ services })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, description, price, durationMinutes, imageUrl, isActive } = body

    if (!name || price === undefined || durationMinutes === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const service = await prisma.service.create({
      data: { name, description, price, durationMinutes, imageUrl, isActive }
    })

    return NextResponse.json({ service }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
