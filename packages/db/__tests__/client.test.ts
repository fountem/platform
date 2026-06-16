import { _resetClients, createServiceClient, createAnonClient } from '../src/index'

describe('db client', () => {
  beforeEach(() => {
    _resetClients()
  })

  it('throws when env vars are missing', () => {
    const orig = process.env.NEXT_PUBLIC_SUPABASE_URL
    delete process.env.NEXT_PUBLIC_SUPABASE_URL
    expect(() => createServiceClient()).toThrow('Missing Supabase env vars')
    process.env.NEXT_PUBLIC_SUPABASE_URL = orig
  })

  it('creates service client with env vars set', () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key'
    const client = createServiceClient()
    expect(client).toBeDefined()
    _resetClients()
  })

  it('returns same singleton on second call', () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key'
    const a = createServiceClient()
    const b = createServiceClient()
    expect(a).toBe(b)
    _resetClients()
  })

  it('creates anon client with env vars set', () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
    const client = createAnonClient()
    expect(client).toBeDefined()
    _resetClients()
  })
})
