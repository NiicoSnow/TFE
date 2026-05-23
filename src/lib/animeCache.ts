import { supabase } from './supabase'
import type { CatalogSectionProps, CatalogSectionVariant } from '../types/catalogSection'
import type { AnimeCacheRow, AnimeCacheSummary } from '../types/animeCache'

const SUMMARY_COLUMNS =
  'anilist_id, title_romaji, title_english, title_native, cover_url, average_score, episodes, season_year'

const CATALOG_EXCLUDED_FORMATS = ['OVA', 'SPECIAL'] as const

function catalogSectionBaseQuery() {
  return supabase
    .from('anime_cache')
    .select(SUMMARY_COLUMNS)
    .not('format', 'in', `(${CATALOG_EXCLUDED_FORMATS.join(',')})`)
}

export async function getAnimeFromCache(anilistId: number) {
  const { data, error } = await supabase
    .from('anime_cache')
    .select('*')
    .eq('anilist_id', anilistId)
    .maybeSingle()

  if (error) throw error
  return data as AnimeCacheRow | null
}

export async function getAnimeSummariesFromCache(anilistIds: number[]) {
  if (anilistIds.length === 0) return [] as AnimeCacheSummary[]

  const { data, error } = await supabase
    .from('anime_cache')
    .select(SUMMARY_COLUMNS)
    .in('anilist_id', anilistIds)

  if (error) throw error
  const rows = (data ?? []) as AnimeCacheSummary[]
  const byId = new Map(rows.map((row) => [row.anilist_id, row]))
  return anilistIds
    .map((id) => byId.get(id))
    .filter((row): row is AnimeCacheSummary => row != null)
}

export async function searchAnimeFromCache(query: string, limit = 20) {
  const q = query.trim()
  if (!q) return [] as AnimeCacheSummary[]

  const { data, error } = await supabase
    .from('anime_cache')
    .select(SUMMARY_COLUMNS)
    .or(
      `title_romaji.ilike.%${q}%,title_english.ilike.%${q}%,title_native.ilike.%${q}%`,
    )
    .order('average_score', { ascending: false, nullsFirst: false })
    .limit(limit)

  if (error) throw error
  return (data ?? []) as AnimeCacheSummary[]
}

export async function listTrendingFromCache(seasonYear: number, limit = 12) {
  const { data, error } = await catalogSectionBaseQuery()
    .eq('season_year', seasonYear)
    .order('average_score', { ascending: false, nullsFirst: false })
    .limit(limit)

  if (error) throw error
  return (data ?? []) as AnimeCacheSummary[]
}

export async function listTopRatedAllTimeFromCache(limit = 15) {
  const { data, error } = await catalogSectionBaseQuery()
    .not('average_score', 'is', null)
    .order('average_score', { ascending: false })
    .limit(limit)

  if (error) throw error
  return (data ?? []) as AnimeCacheSummary[]
}

export async function listUpcomingFromCache(limit = 15) {
  const { data, error } = await catalogSectionBaseQuery()
    .in('status', ['NOT_YET_RELEASED', 'RELEASING'])
    .order('season_year', { ascending: true, nullsFirst: false })
    .order('average_score', { ascending: false, nullsFirst: false })
    .limit(limit)

  if (error) throw error
  return (data ?? []) as AnimeCacheSummary[]
}

export async function listByTagFromCache(tag: string, limit = 15) {
  const { data, error } = await catalogSectionBaseQuery()
    .contains('tags', [tag])
    .order('average_score', { ascending: false, nullsFirst: false })
    .limit(limit)

  if (error) throw error
  return (data ?? []) as AnimeCacheSummary[]
}

export async function listForCatalogSection(config: CatalogSectionProps, limit = 15) {
  if (config.variant === 'tag') {
    return listByTagFromCache(config.tag, limit)
  }

  if (config.variant === 'similar') {
    return listSimilarAnimeFromCache(config.anilistId, config.genres, limit)
  }

  switch (config.variant) {
    case 'trending-year':
      return listTrendingFromCache(new Date().getFullYear(), limit)
    case 'trending-all-time':
      return listTopRatedAllTimeFromCache(limit)
    case 'upcoming':
      return listUpcomingFromCache(limit)
    default: {
      const _exhaustive: never = config
      return _exhaustive
    }
  }
}

export function getCatalogSectionTitle(config: CatalogSectionProps): string {
  if (config.variant === 'tag') {
    return config.tag
  }

  if (config.variant === 'similar') {
    return 'Anime similaire'
  }

  const titles: Record<CatalogSectionVariant, string> = {
    'trending-year': 'Tendance cette année',
    'trending-all-time': 'Tendance all time',
    upcoming: 'Prochainement',
  }
  return titles[config.variant]
}

const EMPTY_MESSAGES: Record<CatalogSectionVariant, string> = {
  'trending-year': 'Aucun anime pour cette année dans le cache.',
  'trending-all-time': 'Aucun anime dans le cache.',
  upcoming: 'Aucun anime à venir dans le cache.',
}

export function getCatalogSectionEmptyMessage(config: CatalogSectionProps): string {
  if (config.variant === 'tag') {
    return `Aucun anime avec le tag « ${config.tag} ».`
  }
  if (config.variant === 'similar') {
    return 'Aucun anime similaire trouvé.'
  }
  return EMPTY_MESSAGES[config.variant]
}

export function formatAnilistScore(score: number | null) {
  if (score == null) return null
  return (score / 10).toFixed(1)
}

const SEASON_LABELS: Record<string, string> = {
  WINTER: 'Hiver',
  SPRING: 'Printemps',
  SUMMER: 'Été',
  FALL: 'Automne',
}

export function formatSeasonRelease(season: string | null, seasonYear: number | null) {
  if (!season && seasonYear == null) return null
  const label = season ? (SEASON_LABELS[season] ?? season) : null
  if (label && seasonYear != null) return `${label} ${seasonYear}`
  return label ?? (seasonYear != null ? String(seasonYear) : null)
}

type SimilarCandidate = AnimeCacheSummary & {
  genres: string[]
}

const SIMILAR_CANDIDATE_POOL = 80

function countGenreOverlap(candidateGenres: string[], sourceGenres: string[]) {
  const source = new Set(sourceGenres)
  return candidateGenres.filter((genre) => source.has(genre)).length
}

function minGenreOverlapForSimilar(sourceGenreCount: number) {
  if (sourceGenreCount <= 1) return 1
  if (sourceGenreCount === 2) return 2
  return 2
}

export async function listSimilarAnimeFromCache(
  anilistId: number,
  genres: string[],
  limit = 5,
) {
  if (genres.length === 0) return [] as AnimeCacheSummary[]

  const orFilter = genres
    .slice(0, 6)
    .map((genre) => `genres.cs.${JSON.stringify([genre])}`)
    .join(',')

  const { data, error } = await supabase
    .from('anime_cache')
    .select(`${SUMMARY_COLUMNS}, genres`)
    .not('format', 'in', `(${CATALOG_EXCLUDED_FORMATS.join(',')})`)
    .neq('anilist_id', anilistId)
    .or(orFilter)
    .limit(SIMILAR_CANDIDATE_POOL)

  if (error) throw error

  const minOverlap = minGenreOverlapForSimilar(genres.length)

  const ranked = ((data ?? []) as SimilarCandidate[])
    .map((row) => ({
      row,
      genreOverlap: countGenreOverlap(row.genres ?? [], genres),
    }))
    .filter(({ genreOverlap }) => genreOverlap >= minOverlap)
    .sort((a, b) => {
      if (b.genreOverlap !== a.genreOverlap) return b.genreOverlap - a.genreOverlap
      return (b.row.average_score ?? 0) - (a.row.average_score ?? 0)
    })
    .slice(0, limit)
    .map(({ row }) => row)

  return ranked as AnimeCacheSummary[]
}

export function getQueryErrorMessage(err: unknown, fallback: string) {
  if (err instanceof Error) return err.message
  if (
    typeof err === 'object' &&
    err !== null &&
    'message' in err &&
    typeof (err as { message: unknown }).message === 'string'
  ) {
    return (err as { message: string }).message
  }
  return fallback
}

export function displayTitle(row: Pick<AnimeCacheSummary, 'title_english' | 'title_romaji' | 'title_native'>) {
  return row.title_english ?? row.title_romaji ?? row.title_native ?? 'Sans titre'
}
