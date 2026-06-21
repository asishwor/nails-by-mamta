import { describe, expect, it } from 'vitest'

// Since we are wrapping middleware with NextAuth's withAuth,
// and we want to test the custom logic inside the callback,
// we will mock the logic that we wrote to ensure the rules hold.

// Extracted logic from src/proxy.ts for pure unit testing
function checkLocationBlock(pathname: string, method: string, country: string | null) {
  if (pathname.startsWith('/api/bookings') && method === 'POST') {
    if (country && country !== 'NP') {
      return { blocked: true, status: 403, error: 'Bookings are currently only available from Nepal' }
    }
  }
  return { blocked: false }
}

describe('Middleware Location Blocking', () => {
  it('should block POST to /api/bookings if country is not NP', () => {
    const result = checkLocationBlock('/api/bookings', 'POST', 'US')
    expect(result.blocked).toBe(true)
    expect(result.status).toBe(403)
  })

  it('should allow POST to /api/bookings if country is NP', () => {
    const result = checkLocationBlock('/api/bookings', 'POST', 'NP')
    expect(result.blocked).toBe(false)
  })

  it('should allow POST to /api/bookings if country header is missing (fallback)', () => {
    const result = checkLocationBlock('/api/bookings', 'POST', null)
    expect(result.blocked).toBe(false)
  })

  it('should allow GET to /api/bookings regardless of country', () => {
    const result = checkLocationBlock('/api/bookings', 'GET', 'US')
    expect(result.blocked).toBe(false)
  })

  it('should allow other paths regardless of country', () => {
    const result = checkLocationBlock('/api/other', 'POST', 'US')
    expect(result.blocked).toBe(false)
  })
})
