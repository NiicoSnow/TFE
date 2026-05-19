import { supabase } from './supabase'
import type { AnimeCacheRow, AnimeCacheSummary } from '../types/animeCache'

const SUMMARY_COLUMNS =
  'anilist_id, title_romaji, title_english, title_native, cover_url, average_score, episodes, season_year'

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
  const { data, error } = await supabase
    .from('anime_cache')
    .select(SUMMARY_COLUMNS)
    .eq('season_year', seasonYear)
    .order('average_score', { ascending: false, nullsFirst: false })
    .limit(limit)

  if (error) throw error
  return (data ?? []) as AnimeCacheSummary[]
}

/** Note AniList 0–100 → affichage /10 */
export function formatAnilistScore(score: number | null) {
  if (score == null) return null
  return (score / 10).toFixed(1)
}

export function displayTitle(row: Pick<AnimeCacheSummary, 'title_english' | 'title_romaji' | 'title_native'>) {
  return row.title_english ?? row.title_romaji ?? row.title_native ?? 'Sans titre'
}
