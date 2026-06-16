/**
 * Seeds the evidence database with initial ONS/IFS/Hansard passages.
 * Run: npx ts-node scripts/seed-evidence.ts
 */

import { ingestSource } from '../packages/rag/src/ingestor'

const SEED_SOURCES = [
  {
    url: 'https://www.ons.gov.uk/peoplepopulationandcommunity/housing/bulletins/housebuildingnewdwellingsengland/2024',
    title: 'House Building: New Dwellings in England 2024',
    publisher: 'Office for National Statistics',
    published_at: '2024-11-28',
    source_type: 'ons' as const,
    raw_text: `House building statistics for 2024 show the number of new dwellings started in England fell to 123,000 in the year to September 2024, down 7% compared with the previous year. This is the lowest level since 2013. Completions also fell by 3% to 148,000 in the same period. The government's target is 300,000 new homes per year. Housing starts peaked at 175,000 in 2019 before falling sharply during the COVID-19 pandemic and recovering partially by 2022.`,
  },
  {
    url: 'https://www.ifs.org.uk/publications/nhs-waiting-lists-analysis-2024',
    title: 'NHS Waiting Lists: Analysis and Projections 2024',
    publisher: 'Institute for Fiscal Studies',
    published_at: '2024-10-15',
    source_type: 'ifs' as const,
    raw_text: `NHS England waiting lists stood at 7.54 million in August 2024, down from a peak of 7.77 million in September 2023 but still substantially higher than the pre-pandemic level of 4.4 million in February 2020. The government target is to reduce waiting lists to 2019 levels by 2028. At the current rate of reduction, modelling suggests this target is unlikely to be achieved within the stated timeframe without significant additional funding or structural reform. Year-on-year reduction through August 2024 was approximately 156,000 patients, not 200,000 as sometimes cited.`,
  },
  {
    url: 'https://www.ifs.org.uk/publications/uk-inflation-wage-growth-2024',
    title: 'UK Inflation and Wage Growth: 2024 Assessment',
    publisher: 'Institute for Fiscal Studies',
    published_at: '2024-09-20',
    source_type: 'ifs' as const,
    raw_text: `UK CPI inflation fell to 2.2% in August 2024, the lowest since July 2021 and close to the Bank of England's 2% target. Wage growth (excluding bonuses) stood at 5.1% in the three months to July 2024, meaning real wages rose by approximately 2.9% year-on-year. This marks the first sustained period of positive real wage growth since 2021. However, cumulative real wages remain approximately 3% below their 2008 peak when adjusted for inflation, meaning living standards have not fully recovered from the financial crisis and subsequent decade of stagnation.`,
  },
  {
    url: 'https://hansard.parliament.uk/commons/2024-10-30',
    title: 'House of Commons Hansard — 30 October 2024',
    publisher: 'UK Parliament',
    published_at: '2024-10-30',
    source_type: 'hansard' as const,
    raw_text: `The Chancellor of the Exchequer, Rachel Reeves, announced in the Autumn Budget 2024 that government borrowing would be £127.5 billion in 2024-25, higher than previously forecast. She stated that economic growth was projected at 1.1% for 2024, rising to 2.0% in 2025 according to Office for Budget Responsibility projections. The OBR also projected that the government would miss its fiscal rules if spending plans remained unchanged beyond the current Parliament.`,
  },
  {
    url: 'https://www.nao.org.uk/reports/immigration-enforcement-2024',
    title: 'Immigration Enforcement: National Audit Office Review 2024',
    publisher: 'National Audit Office',
    published_at: '2024-08-12',
    source_type: 'nao' as const,
    raw_text: `Net migration to the UK was 685,000 in the year to June 2023, the highest on record at that time. By the year to June 2024, net migration had fallen to 446,000, a reduction of 239,000, primarily due to restrictions on international student dependants and changes to health and social care visas introduced in early 2024. The Home Office estimated that approximately 1.2 million people who were granted visas during the pandemic period have not yet left the UK. Asylum claim processing remained severely delayed with over 100,000 pending decisions as of July 2024.`,
  },
]

async function main() {
  console.log(`Seeding ${SEED_SOURCES.length} evidence sources...`)

  for (const source of SEED_SOURCES) {
    try {
      const result = await ingestSource(source)
      console.log(`✓ ${source.title} — ${result.chunks_created} chunks created`)
    } catch (err) {
      console.error(`✗ ${source.title}:`, err)
    }
  }

  console.log('Seeding complete.')
}

main().catch(console.error)
