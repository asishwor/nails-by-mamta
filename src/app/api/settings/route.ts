import { NextResponse } from 'next/server'
import { prisma } from '@/utils/prisma'

export async function GET() {
  try {
    const settings = await prisma.adminSettings.findFirst()
    if (!settings) {
      return NextResponse.json({ settings: null })
    }
    
    // Omit sensitive data
    const publicSettings = {
      workingDays: settings.workingDays,
      startTime: settings.startTime,
      endTime: settings.endTime,
      weeklySchedule: settings.weeklySchedule,
      contactPhone: settings.contactPhone,
      contactLocation: settings.contactLocation,
      googleMapsLink: settings.googleMapsLink,
      socialLinks: settings.socialLinks
    }
    return NextResponse.json({ settings: publicSettings })
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
  }
}
