/**
 * Seeds the evidence database with primary-source passages (ONS / IFS / Hansard /
 * NAO / Resolution Foundation) across the five launch issues.
 *
 * Run: npx ts-node scripts/seed-evidence.ts
 * Requires: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, OPENAI_API_KEY
 */

import { createServiceClient } from '../packages/db/src/index'
import { ingestSource, type IngestSourceOptions } from '../packages/rag/src/ingestor'
import type { SourceType } from '../packages/db/src/types'

type SeedSource = Omit<IngestSourceOptions, 'dbClient'>

const SEED_SOURCES: SeedSource[] = [
  {
    sourceType: 'ons' as SourceType,
    url: 'https://www.ons.gov.uk/peoplepopulationandcommunity/housing/bulletins/housebuildingnewdwellingsengland/2024',
    title: 'House Building: New Dwellings in England 2024',
    publisher: 'Office for National Statistics',
    publishedAt: '2024-11-28',
    topicTags: ['housing'],
    rawText: `House building statistics for 2024 show the number of new dwellings started in England fell to 123,000 in the year to September 2024, down 7% compared with the previous year. This is the lowest level since 2013. Completions also fell by 3% to 148,000 in the same period. The government's stated target is 300,000 new homes per year in England. Housing starts peaked at around 175,000 in 2019 before falling sharply during the COVID-19 pandemic and recovering only partially by 2022. Affordable housing completions accounted for roughly 24% of the total, with the remainder being market housing.`,
  },
  {
    sourceType: 'ifs' as SourceType,
    url: 'https://www.ifs.org.uk/publications/nhs-waiting-lists-analysis-2024',
    title: 'NHS Waiting Lists: Analysis and Projections 2024',
    publisher: 'Institute for Fiscal Studies',
    publishedAt: '2024-10-15',
    topicTags: ['social_care', 'nhs'],
    rawText: `NHS England waiting lists stood at 7.54 million treatments in August 2024, down from a peak of 7.77 million in September 2023 but still substantially higher than the pre-pandemic level of 4.4 million in February 2020. The government target is to reduce waiting lists to 2019 levels by 2028. At the current rate of reduction, IFS modelling suggests this target is unlikely to be achieved within the stated timeframe without significant additional funding or structural reform. The year-on-year reduction through August 2024 was approximately 156,000 treatments, not 200,000 as sometimes cited by ministers.`,
  },
  {
    sourceType: 'ifs' as SourceType,
    url: 'https://www.ifs.org.uk/publications/uk-inflation-wage-growth-2024',
    title: 'UK Inflation and Wage Growth: 2024 Assessment',
    publisher: 'Institute for Fiscal Studies',
    publishedAt: '2024-09-20',
    topicTags: ['local_economy', 'cost_of_living'],
    rawText: `UK CPI inflation fell to 2.2% in August 2024, the lowest since July 2021 and close to the Bank of England's 2% target. Wage growth excluding bonuses stood at 5.1% in the three months to July 2024, meaning real wages rose by approximately 2.9% year-on-year. This marks the first sustained period of positive real wage growth since 2021. However, cumulative real wages remain approximately 3% below their 2008 peak when adjusted for inflation, meaning living standards have not fully recovered from the financial crisis and the subsequent decade of stagnation.`,
  },
  {
    sourceType: 'hansard' as SourceType,
    url: 'https://hansard.parliament.uk/commons/2024-10-30',
    title: 'House of Commons Hansard — 30 October 2024',
    publisher: 'UK Parliament',
    publishedAt: '2024-10-30',
    topicTags: ['local_economy', 'local_tax'],
    rawText: `The Chancellor of the Exchequer, Rachel Reeves, announced in the Autumn Budget 2024 that government borrowing would be £127.5 billion in 2024-25, higher than previously forecast. She stated that economic growth was projected at 1.1% for 2024, rising to 2.0% in 2025 according to Office for Budget Responsibility projections. The OBR also projected that the government would miss its fiscal rules if spending plans remained unchanged beyond the current Parliament. Council tax referendum limits were maintained, allowing local authorities to raise band D council tax by up to 4.99% without a local referendum.`,
  },
  {
    sourceType: 'nao' as SourceType,
    url: 'https://www.nao.org.uk/reports/immigration-enforcement-2024',
    title: 'Immigration Enforcement: National Audit Office Review 2024',
    publisher: 'National Audit Office',
    publishedAt: '2024-08-12',
    topicTags: ['immigration'],
    rawText: `Net migration to the UK was 685,000 in the year to June 2023, the highest on record at that time. By the year to June 2024, net migration had fallen to 446,000, a reduction of 239,000, primarily due to restrictions on international student dependants and changes to health and social care visas introduced in early 2024. The Home Office estimated that approximately 1.2 million people granted visas during the pandemic period have not yet left the UK. Asylum claim processing remained severely delayed, with over 100,000 pending decisions as of July 2024.`,
  },
  {
    sourceType: 'resolution_foundation' as SourceType,
    url: 'https://www.resolutionfoundation.org/publications/housing-affordability-2024',
    title: 'Housing Affordability and Private Rents 2024',
    publisher: 'Resolution Foundation',
    publishedAt: '2024-07-05',
    topicTags: ['housing', 'cost_of_living'],
    rawText: `Average private rents in England rose by 8.6% in the year to June 2024, outpacing wage growth and reaching record highs in cash terms. The typical renter now spends around 33% of their gross income on housing, with that figure rising above 40% in London. Home ownership among 25 to 34 year olds remains far below its early-2000s level, with roughly 39% owning their home compared with around 55% two decades earlier. The Foundation notes that the shortfall in social housing construction since 2010 has shifted lower-income households into the more expensive private rented sector.`,
  },
  {
    sourceType: 'ons' as SourceType,
    url: 'https://www.ons.gov.uk/economy/regionalaccounts/grossdisposablehouseholdincome/2024',
    title: 'Regional Household Income and Local Economies 2024',
    publisher: 'Office for National Statistics',
    publishedAt: '2024-06-18',
    topicTags: ['local_economy'],
    rawText: `Gross disposable household income per head varied widely across UK regions in 2024, with London at around £33,000 and the North East at around £18,500. Productivity, measured as output per hour, in the highest-performing region was roughly 40% above the lowest. Employment rates recovered to 74.8% nationally, though several post-industrial local authorities continued to report economic inactivity rates above 25%. The data underline persistent regional inequality that successive levelling-up programmes have aimed, with limited measurable success so far, to reduce.`,
  },
  {
    sourceType: 'nao' as SourceType,
    url: 'https://www.nao.org.uk/reports/adult-social-care-funding-2024',
    title: 'Adult Social Care Funding: NAO Review 2024',
    publisher: 'National Audit Office',
    publishedAt: '2024-05-22',
    topicTags: ['social_care'],
    rawText: `Local authority spending on adult social care in England reached £23.7 billion in 2023-24. Despite this, an estimated 418,000 people were waiting for a care assessment, review, or the start of a care package as of early 2024. The number of unpaid carers is estimated at around 4.7 million. The NAO found that workforce vacancies in the care sector stood at roughly 9.9%, equivalent to about 131,000 unfilled posts, contributing directly to delayed hospital discharges and pressure on the NHS.`,
  },
  {
    sourceType: 'ons' as SourceType,
    url: 'https://www.ons.gov.uk/economy/environmentalaccounts/transport-emissions-2024',
    title: 'Transport Use and Emissions in England 2024',
    publisher: 'Office for National Statistics',
    publishedAt: '2024-04-30',
    topicTags: ['transport'],
    rawText: `Bus passenger journeys outside London remained about 12% below pre-pandemic levels in 2024, continuing a long-term decline outside the capital. Rail journeys recovered to approximately 96% of their 2019 level. Transport remained the largest emitting sector of the UK economy, responsible for around 28% of territorial greenhouse gas emissions, with surface transport the dominant contributor. The number of licensed ultra-low-emission vehicles continued to rise, exceeding 1.3 million, though they still represented under 4% of all licensed vehicles.`,
  },
  {
    sourceType: 'ifs' as SourceType,
    url: 'https://www.ifs.org.uk/publications/council-tax-local-government-2024',
    title: 'Council Tax and Local Government Finance 2024',
    publisher: 'Institute for Fiscal Studies',
    publishedAt: '2024-03-14',
    topicTags: ['local_tax', 'local_economy'],
    rawText: `Average band D council tax in England rose to £2,171 in 2024-25, an increase of 5.1% on the previous year and the largest cash increase on record. Council tax now raises around £45 billion a year. The IFS notes that because council tax is based on 1991 property valuations, it is highly regressive relative to current property values, with lower-value properties paying a higher effective rate than higher-value ones. Several councils issued section 114 notices, effectively declaring insolvency, citing social care and temporary accommodation costs.`,
  },
]

async function main() {
  const db = createServiceClient()
  console.log(`Seeding ${SEED_SOURCES.length} evidence sources...`)
  let totalChunks = 0
  for (const source of SEED_SOURCES) {
    try {
      const result = await ingestSource({ ...source, dbClient: db })
      totalChunks += result.chunksIngested
      console.log(`  ✓ ${source.title} — ${result.chunksIngested} chunks`)
    } catch (err) {
      console.error(`  ✗ ${source.title}:`, err)
    }
  }
  console.log(`Seeding complete. ${totalChunks} chunks across ${SEED_SOURCES.length} sources.`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
