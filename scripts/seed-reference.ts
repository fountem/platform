/**
 * Seeds factual reference data: parties and issues.
 *
 * Policy positions and track-record scores are intentionally NOT hard-coded here —
 * they are generated from primary-source evidence by the analysis pipeline so every
 * score is defensible and sourced (avoids defamation risk; see plan Phase 6).
 *
 * Run: npx ts-node scripts/seed-reference.ts
 * Requires: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */

import { createServiceClient } from '../packages/db/src/index'

const PARTIES = [
  { slug: 'labour', name: 'Labour Party', short_name: 'Labour', colour_hex: '#e4003b', current_leader: 'Keir Starmer', founded_year: 1900, is_active: true },
  { slug: 'conservatives', name: 'Conservative Party', short_name: 'Conservatives', colour_hex: '#0087DC', current_leader: 'Kemi Badenoch', founded_year: 1834, is_active: true },
  { slug: 'lib-dems', name: 'Liberal Democrats', short_name: 'Lib Dems', colour_hex: '#FAA61A', current_leader: 'Ed Davey', founded_year: 1988, is_active: true },
  { slug: 'reform', name: 'Reform UK', short_name: 'Reform', colour_hex: '#12B6CF', current_leader: 'Nigel Farage', founded_year: 2018, is_active: true },
  { slug: 'green', name: 'Green Party', short_name: 'Greens', colour_hex: '#02a95b', current_leader: 'Carla Denyer & Adrian Ramsay', founded_year: 1990, is_active: true },
]

const ISSUES = [
  { slug: 'housing', title: 'Housing', category: 'domestic', description: 'House building, affordability and private rents.' },
  { slug: 'social_care', title: 'NHS & Social Care', category: 'public_services', description: 'NHS waiting lists and adult social care.' },
  { slug: 'local_economy', title: 'Local Economy', category: 'economy', description: 'Jobs, productivity and regional inequality.' },
  { slug: 'immigration', title: 'Immigration', category: 'home_affairs', description: 'Net migration and asylum.' },
  { slug: 'transport', title: 'Transport', category: 'infrastructure', description: 'Buses, rail and emissions.' },
  { slug: 'local_tax', title: 'Council Tax', category: 'economy', description: 'Council tax and local government finance.' },
]

async function main() {
  const db = createServiceClient()

  const { error: pErr } = await db.from('parties').upsert(PARTIES, { onConflict: 'slug' })
  if (pErr) throw new Error(`parties upsert failed: ${pErr.message}`)
  console.log(`✓ Upserted ${PARTIES.length} parties`)

  const { error: iErr } = await db.from('issues').upsert(ISSUES, { onConflict: 'slug' })
  if (iErr) throw new Error(`issues upsert failed: ${iErr.message}`)
  console.log(`✓ Upserted ${ISSUES.length} issues`)

  console.log('Reference seeding complete.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
