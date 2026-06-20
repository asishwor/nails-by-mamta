import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { createOpenAI } from '@ai-sdk/openai'
import { generateObject, generateText } from 'ai'
import { prisma } from './prisma'

export async function getAiModel(preferredProvider: 'GEMINI' | 'GROQ' = 'GROQ') {
  const now = new Date()
  let keys = await prisma.apiKey.findMany({
    where: {
      provider: preferredProvider,
      isActive: true,
      OR: [
        { blockedUntil: null },
        { blockedUntil: { lt: now } }
      ]
    }
  })

  if (keys.length === 0) {
    const fallbackProvider = preferredProvider === 'GROQ' ? 'GEMINI' : 'GROQ'
    keys = await prisma.apiKey.findMany({
      where: {
        provider: fallbackProvider,
        isActive: true,
        OR: [
          { blockedUntil: null },
          { blockedUntil: { lt: now } }
        ]
      }
    })

    if (keys.length === 0) {
      throw new Error('No available AI API keys. Please add them in Admin Settings.')
    }
  }

  // Random selection acts as a simple load balancer (round-robin approximation)
  const selectedKey = keys[Math.floor(Math.random() * keys.length)]

  if (selectedKey.provider === 'GROQ') {
    const groq = createOpenAI({
      baseURL: 'https://api.groq.com/openai/v1',
      apiKey: selectedKey.key
    })
    return { model: groq('llama3-8b-8192'), keyId: selectedKey.id }
  } else {
    const google = createGoogleGenerativeAI({
      apiKey: selectedKey.key
    })
    return { model: google('gemini-2.5-flash'), keyId: selectedKey.id }
  }
}

export async function handleAiRateLimit(error: any, keyId: string) {
  const errorMsg = error?.message || String(error)
  const isRateLimit = error?.statusCode === 429 || errorMsg.includes('429') || errorMsg.toLowerCase().includes('too many requests') || errorMsg.toLowerCase().includes('quota')

  if (isRateLimit && keyId) {
    console.warn(`[AI] Key ${keyId} rate limited. Blocking for 2 minutes.`)
    const blockedUntil = new Date(Date.now() + 2 * 60 * 1000)
    await prisma.apiKey.update({
      where: { id: keyId },
      data: { blockedUntil }
    })
    return true // indicates we handled a rate limit
  }
  return false
}

// Wrapper for robust AI calls
export async function safeGenerateText(params: any, maxRetries = 2) {
  let attempt = 0
  while (attempt <= maxRetries) {
    const { model, keyId } = await getAiModel()
    console.log(model, keyId)
    try {
      return await generateText({ ...params, model })
    } catch (error: any) {
      const isRateLimit = await handleAiRateLimit(error, keyId)
      if (isRateLimit && attempt < maxRetries) {
        attempt++
        continue
      }
      throw error
    }
  }
}

export async function safeGenerateObject(params: any, maxRetries = 2) {
  let attempt = 0
  while (attempt <= maxRetries) {
    const { model, keyId } = await getAiModel()
    try {
      return await generateObject({ ...params, model })
    } catch (error: any) {
      const isRateLimit = await handleAiRateLimit(error, keyId)
      if (isRateLimit && attempt < maxRetries) {
        attempt++
        continue
      }
      throw error
    }
  }
}
