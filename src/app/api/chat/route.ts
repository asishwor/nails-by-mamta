import { safeGenerateObject } from '@/utils/ai-provider'
import { prisma } from '@/utils/prisma'
import { NextResponse } from 'next/server'
import { z } from 'zod'

export async function POST(request: Request) {
  try {
    const { messages, sessionId, userId, userContext, locale } = await request.json()

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Missing or invalid messages' }, { status: 400 })
    }

    // Get available services to inject as context
    const services = await prisma.service.findMany({
      where: { isActive: true },
      select: { id: true, name: true, description: true, price: true }
    })

    const contextSection = userContext ? `
      USER LIFESTYLE PROFILE:
      - Name: ${userContext.name || 'Not provided'}
      - Job/Profession: ${userContext.job || 'Not specified'}
      - Small Children: ${userContext.smallChildren || 'No'}
      - Heavy Household Work: ${userContext.householdWork || 'No'}
      - Frequent Computer Typing: ${userContext.typeOnComputer || 'No'}
      - Plays Sports: ${userContext.sports || 'No'}
      - Heavy Hand Usage: ${userContext.heavyHandUsage || 'No'}
      - Natural Nail Condition: ${userContext.naturalNailCondition || 'Normal'}
      - Comfort vs Fashion: ${userContext.comfortVsFashion || 'Balanced'}
      - Maintenance Frequency: ${userContext.maintenanceFrequency || 'Not specified'}
      - Strict Workplace Rules: ${userContext.workplaceRules || 'No Rules'}

      CRITICAL LIFESTYLE INSTRUCTIONS:
      - You MUST strictly factor in their lifestyle (Job, Children, Chores, Typing, Sports) into your recommendation.
      - If they do heavy chores, type a lot, or have small children, recommend short lengths and durable shapes like round or oval. DO NOT recommend long stilettos or coffins.
      - If their nails are Weak/Brittle or Damaged, recommend restorative treatments, BIAB (Builder in a Bottle), or gel overlays rather than harsh extensions.
      - Tailor your tone and style recommendations directly to their lifestyle profile above.
    ` : ''

    const systemPrompt = `
      You are the official Personal Styling Assistant for 'Nails by Mamta', a premium nail salon located in Boudha Kumarigal, Kathmandu.

      Your personality: Friendly, expert, and strictly focused on nails and salon services.

      RULES:
      1. CRITICAL: You must ONLY talk about nails, salon services, and booking. If the user asks general questions, politely decline.
      2. CRITICAL LANGUAGE RULE: You MUST respond entirely in the language corresponding to this locale code: "${locale}". If the locale is "ne", you MUST reply entirely in Nepali. If it is "en", reply in English.
      3. CRITICAL IDENTITY RULE: You MUST NEVER refer to yourself as an "AI", "AI assistant", "bot", or "language model". You are a "Personal Styling Assistant" or "Stylist". Ensure this rule is strictly followed.
      4. Your goal is to help the user find the perfect nail style based on their event, mood, or outfit.
      5. Suggest the names of services they might like from our list.

      ${contextSection}

      OUR CURRENT SERVICES:
      ${JSON.stringify(services)}

      Keep your response concise.
    `

    // Get the last 20 messages for context window limiting
    const limitedMessages = messages.slice(-20)

    const result = await safeGenerateObject({
      system: systemPrompt,
      messages: limitedMessages,
      schema: z.object({
        reply: z.string().describe("Your conversational response to the user."),
        suggestedServiceIds: z.array(z.string()).describe("Array of service IDs that best match the user's needs. Empty array if no match."),
        userInfo: z.object({
          name: z.string().optional().describe("User's name if mentioned in the chat."),
          phone: z.string().optional().describe("User's phone number if mentioned."),
          address: z.string().optional().describe("User's location/address if mentioned.")
        }).optional().describe("Any user contact details extracted from the conversation.")
      }),
      temperature: 0.7,
    }, 2, 'chat')

    if (!result || !result.object) {
      return NextResponse.json({ error: 'Failed to generate response' }, { status: 500 })
    }

    const { reply, suggestedServiceIds, userInfo } = result.object as any

    // If we have extracted userInfo and the user is logged in, silently update their profile
    if (userInfo && userId) {
      try {
        const dataToUpdate: any = {}
        if (userInfo.phone) dataToUpdate.phone = userInfo.phone
        if (userInfo.address) dataToUpdate.address = userInfo.address
        if (Object.keys(dataToUpdate).length > 0) {
          await prisma.user.update({
            where: { id: userId },
            data: dataToUpdate
          })
        }
      } catch (updateErr) {
        console.error('Failed to update user info from chat', updateErr)
      }
    }

    let activeSessionId = sessionId
    if (userId) {
      try {
        if (!activeSessionId) {
          const newSession = await prisma.chatSession.create({
            data: { userId, language: locale || 'en' }
          })
          activeSessionId = newSession.id
        }

        // Save the latest user message
        const lastUserMsg = messages[messages.length - 1]
        if (lastUserMsg.role === 'user') {
          await prisma.chatMessage.create({
            data: {
              sessionId: activeSessionId,
              role: 'user',
              content: lastUserMsg.content
            }
          })
        }

        // Save the assistant response
        await prisma.chatMessage.create({
          data: {
            sessionId: activeSessionId,
            role: 'assistant',
            content: reply
          }
        })
      } catch (dbErr) {
        console.error('Failed to save chat to DB', dbErr)
      }
    }

    return NextResponse.json({
      reply,
      suggestedServiceIds,
      userInfo,
      sessionId: activeSessionId
    })

  } catch (error: any) {
    console.error('Chat API Error:', error)
    return NextResponse.json({ error: 'Failed to process chat' }, { status: 500 })
  }
}
