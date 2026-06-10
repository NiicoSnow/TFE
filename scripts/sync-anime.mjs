/**
 * Import / mise à jour du cache AniList => Supabase
 *
 * L'API publique AniList limite à 100 pages (50 entrées/page) par requête.
 * Le mode par défaut découpe le catalogue : année × format × saison.
 *
 * Usage :
 *   node --env-file=.env.local scripts/sync-anime.mjs
 *   node --env-file=.env.local scripts/sync-anime.mjs --pages 3
 *   node --env-file=.env.local scripts/sync-anime.mjs --from-year 2010
 */

import { createClient } from '@supabase/supabase-js'

const ANILIST_GRAPHQL_ENDPOINT = 'https://graphql.anilist.co'
const PAGE_DELAY_MS = 3000
const CHUNK_DELAY_MS = 2500
const PER_PAGE = 50
const MAX_RATE_LIMIT_RETRIES = 8
const ANILIST_MAX_PAGE = 100
const TAG_MIN_RANK = 60

const FORMATS = ['TV', 'MOVIE', 'OVA', 'ONA', 'SPECIAL', 'MUSIC']
const SEASONS = ['WINTER', 'SPRING', 'SUMMER', 'FALL']
const STATUSES = ['FINISHED', 'RELEASING', 'NOT_YET_RELEASED', 'CANCELLED', 'HIATUS']

const MEDIA_FIELDS = `
  id format status episodes averageScore season seasonYear source
  description(asHtml: false) siteUrl
  startDate { year month day }
  endDate { year month day }
  genres
  tags { name rank }
  title { romaji english native }
  coverImage { large color }
  bannerImage
  trailer { id site }
  externalLinks { url site type isDisabled }
  studios(isMain: true) { nodes { name } }
  staff(perPage: 20) {
    edges {
      role
      node { name { full } }
    }
  }
  characters(perPage: 10, sort: ROLE) {
    edges {
      role
      node { name { full } image { medium } }
    }
  }
`

const ANIME_PAGE_QUERY = `
  query AnimeCachePage(
    $page: Int
    $perPage: Int
    $seasonYear: Int
    $format: MediaFormat
    $season: MediaSeason
    $status: MediaStatus
  ) {
    Page(page: $page, perPage: $perPage) {
      pageInfo { hasNextPage currentPage }
      media(
        type: ANIME
        sort: ID
        seasonYear: $seasonYear
        format: $format
        season: $season
        status: $status
      ) {
        ${MEDIA_FIELDS}
      }
    }
  }
`

function mapTags(tags) {
  const names = (tags ?? [])
    .filter((t) => t.name && (t.rank == null || t.rank >= TAG_MIN_RANK))
    .sort((a, b) => (b.rank ?? 0) - (a.rank ?? 0))
    .map((t) => t.name)
  return [...new Set(names)]
}

function mapProducersFromStaff(staff) {
  return (staff?.edges ?? [])
    .filter((e) => e.role && /producer/i.test(String(e.role)))
    .map((e) => ({ name: e.node.name.full ?? 'Inconnu' }))
    .filter((p, i, arr) => arr.findIndex((x) => x.name === p.name) === i)
}

function mapMediaToRow(media) {
  const fuzzyDate = (d) => (d?.year ? { year: d.year, month: d.month, day: d.day } : null)

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
    trailer: media.trailer?.id ? { id: media.trailer.id, site: media.trailer.site } : null,
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

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

function chunkLabel(filters) {
  return [filters.seasonYear, filters.format, filters.season, filters.status]
    .filter((v) => v != null)
    .join('/')
}

function* iterChunks(fromYear, toYear) {
  for (let year = fromYear; year <= toYear; year++) {
    for (const format of FORMATS) {
      for (const season of SEASONS) {
        yield { seasonYear: year, format, season }
      }
    }
  }
}

function parseArgs() {
  const args = process.argv.slice(2)
  let fromYear = 1940
  let toYear = new Date().getFullYear() + 1
  let maxPages = null
  let maxChunks = null
  let warmupSec = 90

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--from-year') fromYear = Number(args[++i])
    if (args[i] === '--to-year') toYear = Number(args[++i])
    if (args[i] === '--pages') maxPages = Number(args[++i])
    if (args[i] === '--chunks') maxChunks = Number(args[++i])
    if (args[i] === '--warmup') warmupSec = Number(args[++i])
    if (args[i] === '--no-warmup') warmupSec = 0
  }

  return { fromYear, toYear, maxPages, maxChunks, warmupSec }
}

function buildQueryVariables(page, filters) {
  const variables = { page, perPage: PER_PAGE }
  if (filters.seasonYear != null) variables.seasonYear = filters.seasonYear
  if (filters.format != null) variables.format = filters.format
  if (filters.season != null) variables.season = filters.season
  if (filters.status != null) variables.status = filters.status
  return variables
}

function isRateLimitError(errors) {
  return (errors ?? []).some(
    (e) => e.status === 429 || /too many requests/i.test(String(e.message)),
  )
}

async function fetchPage(page, filters, rateLimitAttempt = 0) {
  const response = await fetch(ANILIST_GRAPHQL_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      query: ANIME_PAGE_QUERY,
      variables: buildQueryVariables(page, filters),
    }),
  })

  if (response.status === 429) {
    if (rateLimitAttempt >= MAX_RATE_LIMIT_RETRIES) {
      throw new Error('Trop de 429 AniList d’affilée — attendez 10–15 min et relancez.')
    }
    const retryAfter = Number(response.headers.get('Retry-After') ?? 60)
    const waitSec = Math.min(retryAfter * (rateLimitAttempt + 1), 120)
    console.warn(
      `Rate limited — pause ${waitSec}s (quota IP encore saturé, tentative ${rateLimitAttempt + 1}/${MAX_RATE_LIMIT_RETRIES})`,
    )
    await sleep(waitSec * 1000)
    return fetchPage(page, filters, rateLimitAttempt + 1)
  }

  const result = await response.json()

  if (isRateLimitError(result.errors)) {
    if (rateLimitAttempt >= MAX_RATE_LIMIT_RETRIES) {
      throw new Error('Trop de 429 AniList d’affilée — attendez 10–15 min et relancez.')
    }
    const waitSec = 60 * (rateLimitAttempt + 1)
    console.warn(`Rate limited (GraphQL) — pause ${waitSec}s…`)
    await sleep(waitSec * 1000)
    return fetchPage(page, filters, rateLimitAttempt + 1)
  }

  if (!response.ok || result.errors?.length) {
    throw new Error(result.errors?.[0]?.message ?? `HTTP ${response.status}`)
  }

  const pageData = result.data?.Page
  if (!pageData) throw new Error('No Page data')

  return {
    pageInfo: pageData.pageInfo,
    rows: (pageData.media ?? []).map(mapMediaToRow),
  }
}

async function syncChunk(supabase, filters, { maxPages } = {}) {
  const label = chunkLabel(filters)
  let page = 1
  let upserted = 0
  let truncated = false

  while (page <= ANILIST_MAX_PAGE) {
    if (maxPages != null && page > maxPages) break

    const { pageInfo, rows } = await fetchPage(page, filters)

    if (rows.length === 0 && page === 1) {
      console.log(`[${label}] aucun résultat`)
      break
    }

    if (rows.length > 0) {
      const { error } = await supabase.from('anime_cache').upsert(rows, {
        onConflict: 'anilist_id',
      })
      if (error) throw error
      upserted += rows.length
    }

    console.log(`[${label}] page ${pageInfo.currentPage} — +${rows.length} (lot ${upserted})`)

    if (!pageInfo.hasNextPage) break

    if (page >= ANILIST_MAX_PAGE) {
      truncated = true
      console.warn(`[${label}] limite 100 pages API — sous-division…`)
      break
    }

    page += 1
    await sleep(PAGE_DELAY_MS)
  }

  return { upserted, truncated }
}

async function syncChunkWithSplit(supabase, filters, opts) {
  const { upserted, truncated } = await syncChunk(supabase, filters, opts)
  if (!truncated) return upserted

  if (filters.status) {
    console.error(
      `[${chunkLabel(filters)}] trop volumineux même avec status — entrées partielles seulement.`,
    )
    return upserted
  }

  let subTotal = 0
  for (const status of STATUSES) {
    subTotal += await syncChunkWithSplit(
      supabase,
      { ...filters, status },
      { ...opts, maxPages: opts.maxPages != null ? Math.max(0, opts.maxPages - 1) : null },
    )
  }
  return upserted + subTotal
}

async function main() {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
    process.exit(1)
  }

  const { fromYear, toYear, maxPages, maxChunks, warmupSec } = parseArgs()
  const supabase = createClient(url, key)

  let totalUpserted = 0
  let chunksDone = 0

  console.log(
    `Sync AniList => anime_cache (${fromYear}–${toYear}, découpé par année/format/saison)…`,
  )

  if (warmupSec > 0) {
    console.log(`Pause initiale ${warmupSec}s avant la 1re requête…`)
    await sleep(warmupSec * 1000)
  }

  console.log('Démarrage des requêtes AniList…')

  for (const chunk of iterChunks(fromYear, toYear)) {
    if (maxChunks != null && chunksDone >= maxChunks) break

    const added = await syncChunkWithSplit(supabase, chunk, { maxPages })
    totalUpserted += added
    chunksDone += 1

    if (maxPages != null) break

    await sleep(CHUNK_DELAY_MS)
  }

  console.log(`Terminé : ~${totalUpserted} upserts (${chunksDone} lots traités).`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
