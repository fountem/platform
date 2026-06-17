import { createBrowserClient } from '@supabase/ssr'

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

/** Browser Supabase client for client components (login, sign-out). */
export function createSupabaseBrowserClient() {
  return createBrowserClient(URL, ANON)
}
