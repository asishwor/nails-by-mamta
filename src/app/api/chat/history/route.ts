import { authOptions } from '@/lib/auth'
import { prisma } from '@/utils/prisma'
import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'

import jwt from 'jsonwebtoken'
import { NextRequest } from 'next/server'

const SECRET = process.env.NEXTAUTH_SECRET || 'fallback_secret_for_development_change_in_production'

function getUserFromToken(req: Request) {
  const auth = req.headers.get('authorization')
  if (!auth?.startsWith('Bearer ')) return null
  try {
    return jwt.verify(auth.slice(7), SECRET) as { id: string; email: string; role: string }
  } catch {
    return null
  }
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    const tokenUser = getUserFromToken(req)
    const userId = session?.user?.id || tokenUser?.id

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Find the most recent chat session for this user
    const chatSession = await prisma.chatSession.findFirst({
      where: { userId: userId },
      orderBy: { updatedAt: 'desc' },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          take: 50 // Get the last 50 messages to keep the context window reasonable
        }
      }
    })

    if (!chatSession) {
      return NextResponse.json({ messages: [], sessionId: null })
    }

    // Format messages to match the frontend Message type
    const formattedMessages = chatSession.messages.map((msg: any) => ({
      id: msg.id,
      role: msg.role,
      content: msg.content
    }))

    return NextResponse.json({ 
      messages: formattedMessages,
      sessionId: chatSession.id 
    })
  } catch (error: any) {
    console.error('Failed to fetch chat history:', error)
    return NextResponse.json({ error: 'Failed to fetch chat history' }, { status: 500 })
  }
}
