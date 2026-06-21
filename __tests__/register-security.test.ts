import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from '@/app/api/auth/register/route'
import { prisma } from '@/utils/prisma'
import rateLimit from '@/lib/rate-limit'

// Mock prisma and bcrypt to test just the route logic and rate limiter
vi.mock('@/utils/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    }
  }
}))

vi.mock('bcryptjs', () => ({
  default: {
    hash: vi.fn().mockResolvedValue('hashed_password'),
  }
}))

// We need a way to mock the rate limiter or we can just test the actual rate limit logic 
// by sending multiple requests. Since the rate limiter is instantiated in the module scope,
// we can just hit the POST function multiple times to see it fail.

describe('Register Route Security', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset the internal cache of rate limit if possible, 
    // but since we can't easily reset module-level variables without vi.resetModules(),
    // we'll just use a unique IP address for each test run to avoid cross-contamination.
  })

  const createMockRequest = (ip: string) => {
    return new Request('http://localhost/api/auth/register', {
      method: 'POST',
      headers: {
        'x-forwarded-for': ip,
      },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User'
      })
    })
  }

  it('should allow up to 3 registrations per IP and block the 4th (Spam Protection)', async () => {
    const testIp = '192.168.1.100' // unique IP for this test
    
    // Mock prisma to simulate a successful registration
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null)
    vi.mocked(prisma.user.create).mockResolvedValue({ id: '1', email: 'test@example.com' } as any)

    // First 3 requests should pass the rate limit
    let res1 = await POST(createMockRequest(testIp))
    let res2 = await POST(createMockRequest(testIp))
    let res3 = await POST(createMockRequest(testIp))

    expect(res1.status).toBe(200)
    expect(res2.status).toBe(200)
    expect(res3.status).toBe(200)

    // 4th request should be rate-limited (429 Too Many Requests)
    let res4 = await POST(createMockRequest(testIp))
    expect(res4.status).toBe(429)
    const data = await res4.json()
    expect(data.error).toBe('Too many registration attempts. Please try again later.')
  })
})
