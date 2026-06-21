import { safeGenerateText } from '@/utils/ai-provider'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { dashboardData } = await request.json()

    if (!dashboardData) {
      return NextResponse.json({ error: 'Missing dashboard data' }, { status: 400 })
    }

    const prompt = `
    You are an expert business analyst for a Nails By Mamta - Premium Nail Studio.
    Analyze the following salon dashboard metrics and provide a brief, insightful, 2-3 paragraph summary.
    Highlight any interesting trends, especially regarding guest vs registered users, cancellation rates, or recent booking spikes in the 14-day chart data.
    Be encouraging but professional.

    Response Language: Nepali

    Data:
    ${JSON.stringify(dashboardData, null, 2)}
    `

    const result = await safeGenerateText({
      prompt,
      maxTokens: 500,
      temperature: 0.7,
    })

    return NextResponse.json({ analysis: result?.text })
  } catch (error: any) {
    console.error('AI Analytics Error:', error)
    return NextResponse.json({ error: 'Failed to generate AI analysis. Have you added an API key?' }, { status: 500 })
  }
}
