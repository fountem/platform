export interface PartyData {
  slug: string
  name: string
  shortName: string
  colour: string
  leader: string
  description: string
}

export const PARTIES: PartyData[] = [
  {
    slug: 'labour',
    name: 'Labour Party',
    shortName: 'Labour',
    colour: '#e4003b',
    leader: 'Keir Starmer',
    description: 'Centre-left. In government since July 2024.',
  },
  {
    slug: 'conservatives',
    name: 'Conservative Party',
    shortName: 'Tories',
    colour: '#0087DC',
    leader: 'Kemi Badenoch',
    description: 'Centre-right. In opposition since July 2024.',
  },
  {
    slug: 'lib-dems',
    name: 'Liberal Democrats',
    shortName: 'Lib Dems',
    colour: '#FAA61A',
    leader: 'Ed Davey',
    description: 'Centrist. Third-largest party by seats.',
  },
  {
    slug: 'reform',
    name: 'Reform UK',
    shortName: 'Reform',
    colour: '#12B6CF',
    leader: 'Nigel Farage',
    description: 'Right-wing populist. 5 MPs, growing vote share.',
  },
  {
    slug: 'green',
    name: 'Green Party',
    shortName: 'Greens',
    colour: '#02a95b',
    leader: 'Carla Denyer & Adrian Ramsay',
    description: 'Green left. 4 MPs after 2024 general election.',
  },
]

// Issue slugs mirror the evidence corpus topic tags so retrieval can filter by issue.
export const ISSUES = [
  { slug: 'housing', label: 'Housing' },
  { slug: 'social_care', label: 'NHS & Social Care' },
  { slug: 'local_economy', label: 'Local Economy' },
  { slug: 'immigration', label: 'Immigration' },
  { slug: 'transport', label: 'Transport' },
  { slug: 'local_tax', label: 'Council Tax' },
]
