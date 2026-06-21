import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getUserSession } from '@/lib/session'
import { getServerSession } from 'next-auth/next'
import { getToken } from 'next-auth/jwt'

// Mock next-auth modules
vi.mock('next-auth/next', () => ({
  getServerSession: vi.fn()
}))

vi.mock('next-auth/jwt', () => ({
  getToken: vi.fn()
}))

// Mock auth module so it doesn't load prisma
vi.mock('@/lib/auth', () => ({
  authOptions: {}
}))

describe('getUserSession Utility', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return session from cookies if available (Web)', async () => {
    const mockSession = { user: { id: 'web-user', role: 'ADMIN' } }
    vi.mocked(getServerSession).mockResolvedValueOnce(mockSession as any)

    const req = new Request('http://localhost')
    const session = await getUserSession(req)

    expect(session).toEqual(mockSession)
    // Should return early and not check getToken
    expect(getToken).not.toHaveBeenCalled()
  })

  it('should fallback to getToken if cookie session is missing (Mobile)', async () => {
    vi.mocked(getServerSession).mockResolvedValueOnce(null)
    const mockToken = { id: 'mobile-user', role: 'USER', email: 'test@test.com', name: 'Test' }
    vi.mocked(getToken).mockResolvedValueOnce(mockToken as any)

    const req = new Request('http://localhost', {
      headers: { 'Authorization': 'Bearer test-token' }
    })
    
    const session = await getUserSession(req)

    expect(getServerSession).toHaveBeenCalled()
    expect(getToken).toHaveBeenCalled()
    expect(session).toEqual({
      user: {
        id: 'mobile-user',
        role: 'USER',
        email: 'test@test.com',
        name: 'Test'
      }
    })
  })

  it('should return null if neither cookie nor token is present', async () => {
    vi.mocked(getServerSession).mockResolvedValueOnce(null)
    vi.mocked(getToken).mockResolvedValueOnce(null)

    const req = new Request('http://localhost')
    const session = await getUserSession(req)

    expect(session).toBeNull()
  })
})
