import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { createOpenAI } from '@ai-sdk/openai'
import { generateObject, generateText } from 'ai'
import { prisma } from './prisma'

export async function getAiModel(preferredProvider: 'GEMINI' | 'GROQ' = 'GROQ', useCase: 'search' | 'chat' = 'search') {
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
  const customModels = selectedKey.models as any || {}

  if (selectedKey.provider === 'GROQ') {
    const groq = createOpenAI({
      baseURL: 'https://api.groq.com/openai/v1',
      apiKey: selectedKey.key
    })
    const modelName = customModels[useCase] || 'llama-3.1-8b-instant'
    return { model: groq(modelName), keyId: selectedKey.id }
  } else {
    const google = createGoogleGenerativeAI({
      apiKey: selectedKey.key
    })
    const modelName = customModels[useCase] || 'gemini-2.5-flash'
    return { model: google(modelName), keyId: selectedKey.id }
  }
}

export async function handleAiError(error: any, keyId: string) {
  // We now catch ANY error (rate limit, unauthorized, server down) to trigger failover
  if (keyId) {
    console.warn(`[AI] Key ${keyId} encountered an error. Blocking for 2 minutes to failover. Error:`, error?.message || error)
    const blockedUntil = new Date(Date.now() + 2 * 60 * 1000)
    await prisma.apiKey.update({
      where: { id: keyId },
      data: { blockedUntil }
    })
    return true
  }
  return false
}

// Wrapper for robust AI calls
export async function safeGenerateText(params: any, maxRetries = 2, useCase: 'search' | 'chat' = 'search') {
  let attempt = 0
  while (attempt <= maxRetries) {
    const { model, keyId } = await getAiModel('GROQ', useCase)
    try {
      return await generateText({ ...params, model })
    } catch (error: any) {
      const handled = await handleAiError(error, keyId)
      if (handled && attempt < maxRetries) {
        attempt++
        continue
      }
      throw error
    }
  }
}

import { streamText } from 'ai'

export async function safeStreamText(params: any, maxRetries = 2, useCase: 'search' | 'chat' = 'chat') {
  let attempt = 0
  while (attempt <= maxRetries) {
    const { model, keyId } = await getAiModel('GROQ', useCase)
    try {
      // Return the result directly; streamText throws immediately if API key/connection fails
      return streamText({ ...params, model })
    } catch (error: any) {
      const handled = await handleAiError(error, keyId)
      if (handled && attempt < maxRetries) {
        attempt++
        continue
      }
      throw error
    }
  }
  throw new Error("Failed to stream text")
}

export async function safeGenerateObject(params: any, maxRetries = 2, useCase: 'search' | 'chat' = 'search') {
  let attempt = 0
  while (attempt <= maxRetries) {
    const { model, keyId } = await getAiModel('GROQ', useCase)
    try {
      return await generateObject({ ...params, model })
    } catch (error: any) {
      const handled = await handleAiError(error, keyId)
      if (handled && attempt < maxRetries) {
        attempt++
        continue
      }
      throw error
    }
  }
}
