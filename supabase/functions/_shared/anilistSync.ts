export const ANILIST_GRAPHQL_ENDPOINT = 'https://graphql.anilist.co'
export const PAGE_DELAY_MS = 2100
export const TAG_MIN_RANK = 60
export const ANIME_PAGE_QUERY = `
  query AnimeCachePage($page: Int, $perPage: Int) {
    Page(page: $page, perPage: $perPage) {
      pageInfo {
        hasNextPage
        currentPage
        lastPage
      }
      media(type: ANIME, sort: ID) {
        id
        format
        status
        episodes
        averageScore
        season
        seasonYear
        source
        description(asHtml: false)
        siteUrl
        startDate { year month day }
        endDate { year month day }
        genres
        tags {
          name
          rank
        }
        title { romaji english native }
        coverImage { large color }
        bannerImage
        trailer { id site }
        externalLinks {
          url
          site
          type
          isDisabled
        }
        studios(isMain: true) {
          nodes { name }
        }
        staff(perPage: 20) {
          edges {
            role
            node {
              name { full }
            }
          }
        }
        characters(perPage: 10, sort: ROLE) {
          edges {
            role
            node {
              name { full }
              image { medium }
            }
          }
        }
      }
    }
  }
`

type AnilistMedia = {
  id: number
  format: string | null
  status: string | null
  episodes: number | null
  averageScore: number | null
  season: string | null
  seasonYear: number | null
  source: string | null
  description: string | null
  siteUrl: string | null
  startDate: { year: number | null; month: number | null; day: number | null } | null
  endDate: { year: number | null; month: number | null; day: number | null } | null
  genres: string[] | null
  tags: Array<{ name: string; rank: number | null }> | null
  title: { romaji: string | null; english: string | null; native: string | null }
  coverImage: { large: string | null; color: string | null } | null
  bannerImage: string | null
  trailer: { id: string | null; site: string | null } | null
  externalLinks: Array<{
    url: string
    site: string | null
    type: string | null
    isDisabled: boolean | null
  }> | null
  studios: { nodes: Array<{ name: string }> } | null
  staff: {
    edges: Array<{
      role: string | null
      node: { name: { full: string | null } }
    }>
  } | null
  characters: {
    edges: Array<{
      role: string | null
      node: { name: { full: string | null }; image: { medium: string | null } | null }
    }>
  } | null
}

type PageResponse = {
  Page: {
    pageInfo: { hasNextPage: boolean; currentPage: number; lastPage: number }
    media: AnilistMedia[] | null
  } | null
}

export type AnimeCacheInsert = {
  anilist_id: number
  title_romaji: string | null
  title_english: string | null
  title_native: string | null
  cover_url: string | null
  cover_color: string | null
  banner_url: string | null
  site_url: string | null
  format: string | null
  status: string | null
  episodes: number | null
  average_score: number | null
  season: string | null
  season_year: number | null
  start_date: unknown
  end_date: unknown
  adaptation_source: string | null
  synopsis: string | null
  genres: unknown
  tags: unknown
  studios: unknown
  producers: unknown
  characters: unknown
  trailer: unknown
  watch_links: unknown
  raw: unknown
  synced_at: string
}

function mapTags(tags: AnilistMedia['tags']) {
  const names = (tags ?? [])
    .filter((t) => t.name && (t.rank == null || t.rank >= TAG_MIN_RANK))
    .sort((a, b) => (b.rank ?? 0) - (a.rank ?? 0))
    .map((t) => t.name)
  return [...new Set(names)]
}

function mapProducersFromStaff(staff: AnilistMedia['staff']) {
  return (staff?.edges ?? [])
    .filter((e) => e.role && /producer/i.test(e.role))
    .map((e) => ({ name: e.node.name.full ?? 'Inconnu' }))
    .filter((p, i, arr) => arr.findIndex((x) => x.name === p.name) === i)
}

export function mapMediaToRow(media: AnilistMedia): AnimeCacheInsert {
  const fuzzyDate = (d: AnilistMedia['startDate']) =>
    d?.year ? { year: d.year, month: d.month, day: d.day } : null

  return {
    anilist_id: media.id,
    title_romaji: media.title.romaji,
    title_english: media.title.english,
    title_native: media.title.native,
    cover_url: media.coverImage?.large ?? null,
    cover_color: media.coverImage?.color ?? null,
    banner_url: media.bannerImage ?? null,
    site_url: media.siteUrl,
    format: media.format,
    status: media.status,
    episodes: media.episodes,
    average_score: media.averageScore,
    season: media.season,
    season_year: media.seasonYear,
    start_date: fuzzyDate(media.startDate),
    end_date: fuzzyDate(media.endDate),
    adaptation_source: media.source,
    synopsis: media.description,
    genres: media.genres ?? [],
    tags: mapTags(media.tags),
    studios: (media.studios?.nodes ?? []).map((n) => ({ name: n.name })),
    producers: mapProducersFromStaff(media.staff),
    characters: (media.characters?.edges ?? []).map((e) => ({
      role: e.role,
      name: e.node.name.full,
      image: e.node.image?.medium ?? null,
    })),
    trailer: media.trailer?.id
      ? { id: media.trailer.id, site: media.trailer.site }
      : null,
    watch_links: (media.externalLinks ?? [])
      .filter((l) => !l.isDisabled)
      .map((l) => ({
        url: l.url,
        site: l.site,
        type: l.type,
        isDisabled: Boolean(l.isDisabled),
      })),
    raw: media,
    synced_at: new Date().toISOString(),
  }
}

export async function fetchAnilistPage(page: number, perPage = 50) {
  const response = await fetch(ANILIST_GRAPHQL_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      query: ANIME_PAGE_QUERY,
      variables: { page, perPage },
    }),
  })

  if (response.status === 429) {
    const retryAfter = Number(response.headers.get('Retry-After') ?? 60)
    return { rateLimited: true as const, retryAfter }
  }

  const result = (await response.json()) as {
    data?: PageResponse
    errors?: Array<{ message: string }>
  }

  if (!response.ok || result.errors?.length) {
    throw new Error(result.errors?.[0]?.message ?? `AniList HTTP ${response.status}`)
  }

  const pageData = result.data?.Page
  if (!pageData) throw new Error('AniList returned no Page data')

  return {
    rateLimited: false as const,
    pageInfo: pageData.pageInfo,
    rows: (pageData.media ?? []).map(mapMediaToRow),
  }
}

export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
