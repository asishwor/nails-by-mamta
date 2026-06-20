import { NextResponse } from 'next/server'
import { prisma } from '@/utils/prisma'
import { safeGenerateObject } from '@/utils/ai-provider'
import { z } from 'zod'

export async function POST(request: Request) {
  try {
    const { query } = await request.json()
    if (!query) return NextResponse.json({ error: 'Missing query' }, { status: 400 })

    const services = await prisma.service.findMany({
      where: { isActive: true },
      select: { id: true, name: true, description: true }
    })

    const prompt = `
    The user is looking for a nail salon service. 
    Their request: "${query}"
    
    Here is the list of available services:
    ${JSON.stringify(services)}

    Analyze the user's request and recommend the best matching services from the list.
    Return a JSON array containing ONLY the string IDs of the recommended services. Do not include services that are completely irrelevant.
    `

    const { object } = await safeGenerateObject({
      prompt,
      schema: z.object({
        recommendedServiceIds: z.array(z.string())
      }),
      system: "You are a helpful AI assistant that matches user queries to service IDs."
    })

    return NextResponse.json({ recommendedIds: object.recommendedServiceIds })
  } catch (error: any) {
    console.error('AI Search Error:', error)
    return NextResponse.json({ error: 'Failed to process search' }, { status: 500 })
  }
}
