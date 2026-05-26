import { displayTitle, formatAnilistScore, getAnimeSummariesFromCache, getQueryErrorMessage } from './animeCache'
import { supabase } from './supabase'
import type { AnimeListStatus, LibraryAnimeItem, UserAnimeLibraryRow } from '../types/animeLibrary'

const POSTER_FALLBACK =
  'https://placehold.co/72x102/1e293b/9ca3af?text=Poster'

export const ANIME_LIST_STATUSES: AnimeListStatus[] = [
  'planned',
  'watching',
  'paused',
  'completed',
]

export const ANIME_LIST_LABELS: Record<AnimeListStatus, string> = {
  planned: "C'est prévu",
  watching: 'En train de regarder',
  paused: 'En pause',
  completed: 'Fini',
}

export const ANIME_LIST_LABELS_ORDERED = ANIME_LIST_STATUSES.map(
  (status) => ANIME_LIST_LABELS[status],
)

export function statusToCategoryIndex(status: AnimeListStatus) {
  return ANIME_LIST_STATUSES.indexOf(status)
}

export function categoryIndexToStatus(index: number): AnimeListStatus {
  return ANIME_LIST_STATUSES[index] ?? 'planned'
}

export { getQueryErrorMessage }

export async function getLibraryStatusesForAnimes(
  userId: string,
  anilistIds: number[],
): Promise<Map<number, AnimeListStatus>> {
  if (anilistIds.length === 0) return new Map()

  const { data, error } = await supabase
    .from('user_anime_library')
    .select('anilist_id, status')
    .eq('user_id', userId)
    .in('anilist_id', anilistIds)

  if (error) throw error

  const map = new Map<number, AnimeListStatus>()
  for (const row of data ?? []) {
    map.set(row.anilist_id as number, row.status as AnimeListStatus)
  }
  return map
}

export async function getLibraryStatusForAnime(
  userId: string,
  anilistId: number,
): Promise<AnimeListStatus | null> {
  const { data, error } = await supabase
    .from('user_anime_library')
    .select('status')
    .eq('user_id', userId)
    .eq('anilist_id', anilistId)
    .maybeSingle()

  if (error) throw error
  return (data?.status as AnimeListStatus | undefined) ?? null
}

export async function setAnimeListStatus(
  userId: string,
  anilistId: number,
  status: AnimeListStatus,
) {
  const { error } = await supabase.from('user_anime_library').upsert(
    {
      user_id: userId,
      anilist_id: anilistId,
      status,
    },
    { onConflict: 'user_id,anilist_id' },
  )

  if (error) throw error
}

function summaryToLibraryItem(
  row: UserAnimeLibraryRow,
  summary: Awaited<ReturnType<typeof getAnimeSummariesFromCache>>[number],
): LibraryAnimeItem {
  return {
    libraryId: row.id,
    anilistId: row.anilist_id,
    title: displayTitle(summary),
    rating: formatAnilistScore(summary.average_score),
    poster: summary.cover_url ?? POSTER_FALLBACK,
  }
}

export async function fetchUserLibraryByCategory(
  userId: string,
): Promise<LibraryAnimeItem[][]> {
  const { data, error } = await supabase
    .from('user_anime_library')
    .select('id, user_id, anilist_id, status, sort_order, created_at, updated_at')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })

  if (error) throw error

  const rows = (data ?? []) as UserAnimeLibraryRow[]
  if (rows.length === 0) {
    return ANIME_LIST_STATUSES.map(() => [])
  }

  const summaries = await getAnimeSummariesFromCache(
    rows.map((row) => row.anilist_id),
  )
  const summaryById = new Map(summaries.map((s) => [s.anilist_id, s]))

  const grouped: LibraryAnimeItem[][] = ANIME_LIST_STATUSES.map(() => [])

  for (const row of rows) {
    const summary = summaryById.get(row.anilist_id)
    if (!summary) continue

    const index = statusToCategoryIndex(row.status)
    if (index < 0) continue

    grouped[index].push(summaryToLibraryItem(row, summary))
  }

  return grouped
}
