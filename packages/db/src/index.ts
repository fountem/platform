import { createClient } from '@supabase/supabase-js'
import type { Database } from './types'

export const createSupabaseClient = (supabaseUrl: string, supabaseKey: string) =>
  createClient<Database>(supabaseUrl, supabaseKey)

export const createServiceClient = () =>
  createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

export const createPublicClient = () =>
  createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

export * from './types'
