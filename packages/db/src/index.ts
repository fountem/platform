import { createClient, SupabaseClient } from '@supabase/supabase-js'
import type { Database } from './types'

export type { Database }
export * from './types'

// Node 20 requires ws package for Supabase realtime
function getWebSocketImpl() {
  if (typeof WebSocket !== 'undefined') return undefined // native (Node 22+, browsers)
  try {
    return require('ws')
  } catch {
    return undefined
  }
}

let _serviceClient: SupabaseClient<Database> | null = null
let _anonClient: SupabaseClient<Database> | null = null

export function createServiceClient(): SupabaseClient<Database> {
  if (_serviceClient) return _serviceClient
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Missing Supabase env vars: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY')
  const ws = getWebSocketImpl()
  _serviceClient = createClient<Database>(url, key, {
    auth: { persistSession: false },
    realtime: ws ? { transport: ws } : undefined,
  })
  return _serviceClient
}

export function createAnonClient(): SupabaseClient<Database> {
  if (_anonClient) return _anonClient
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) throw new Error('Missing Supabase env vars: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY')
  const ws = getWebSocketImpl()
  _anonClient = createClient<Database>(url, key, {
    realtime: ws ? { transport: ws } : undefined,
  })
  return _anonClient
}

export function _resetClients() {
  _serviceClient = null
  _anonClient = null
}
