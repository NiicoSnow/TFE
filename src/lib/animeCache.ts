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
  return EMPTY_MESSAGES[config.variant]
}

export function formatAnilistScore(score: number | null) {
  if (score == null) return null
  return (score / 10).toFixed(1)
}

export function displayTitle(row: Pick<AnimeCacheSummary, 'title_english' | 'title_romaji' | 'title_native'>) {
  return row.title_english ?? row.title_romaji ?? row.title_native ?? 'Sans titre'
}
