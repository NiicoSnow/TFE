export type AnilistFuzzyDate = {
  year: number | null
  month: number | null
  day: number | null
}

export type AnimeCacheCharacter = {
  role: string | null
  name: string | null
  image: string | null
}

export type AnimeCacheNamedEntry = {
  name: string
}

export type AnimeCacheTrailer = {
  id: string | null
  site: string | null
}

export type AnimeCacheWatchLink = {
  url: string
  site: string | null
  type: string | null
  isDisabled: boolean
}

export type AnimeCacheRow = {
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
  start_date: AnilistFuzzyDate | null
  end_date: AnilistFuzzyDate | null
  adaptation_source: string | null
  synopsis: string | null
  genres: string[]
  tags: string[]
  studios: AnimeCacheNamedEntry[]
  producers: AnimeCacheNamedEntry[]
  characters: AnimeCacheCharacter[]
  trailer: AnimeCacheTrailer | null
  watch_links: AnimeCacheWatchLink[]
  raw: unknown | null
  updated_at: string
  synced_at: string
}

export type AnimeCacheSummary = Pick<
  AnimeCacheRow,
  | 'anilist_id'
  | 'title_romaji'
  | 'title_english'
  | 'title_native'
  | 'cover_url'
  | 'average_score'
  | 'episodes'
  | 'season_year'
>
