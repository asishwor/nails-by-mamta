import { describe, it, expect, beforeEach } from 'vitest'
import rateLimit from '@/lib/rate-limit'

describe('Rate Limiter', () => {
  let limiter: ReturnType<typeof rateLimit>

  beforeEach(() => {
    // Reset the rate limiter before each test
    limiter = rateLimit({
      interval: 60000,
      uniqueTokenPerInterval: 500,
    })
  })

  it('should allow requests under the limit', async () => {
    await expect(limiter.check(3, 'test_token')).resolves.toBeUndefined()
    await expect(limiter.check(3, 'test_token')).resolves.toBeUndefined()
    await expect(limiter.check(3, 'test_token')).resolves.toBeUndefined()
  })

  it('should reject requests over the limit', async () => {
    // Make 3 successful requests
    await limiter.check(3, 'spam_token')
    await limiter.check(3, 'spam_token')
    await limiter.check(3, 'spam_token')

    // The 4th request should fail
    await expect(limiter.check(3, 'spam_token')).rejects.toBe('Rate limit exceeded')
  })

  it('should isolate limits per unique token', async () => {
    // User 1 uses all their quota
    await limiter.check(2, 'user_1')
    await limiter.check(2, 'user_1')
    await expect(limiter.check(2, 'user_1')).rejects.toBe('Rate limit exceeded')

    // User 2 should still be allowed since limits are per token
    await expect(limiter.check(2, 'user_2')).resolves.toBeUndefined()
  })
})
