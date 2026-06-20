import { NextResponse } from 'next/server'
import { prisma } from '@/utils/prisma'

export async function GET() {
  try {
    const settings = await prisma.adminSettings.findFirst()
    return NextResponse.json({ settings })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { 
      id, workingDays, startTime, endTime, weeklySchedule, bufferTimeMinutes,
      contactPhone, contactLocation, googleMapsLink, socialLinks,
      googleClientId, googleIosClientId, googleAndroidClientId
    } = body

    if (!id) {
      return NextResponse.json({ error: 'Missing ID' }, { status: 400 })
    }

    const updated = await prisma.adminSettings.update({
      where: { id },
      data: { 
        workingDays, startTime, endTime, weeklySchedule, bufferTimeMinutes,
        contactPhone, contactLocation, googleMapsLink, socialLinks,
        googleClientId, googleIosClientId, googleAndroidClientId
      }
    })

    return NextResponse.json({ settings: updated })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
