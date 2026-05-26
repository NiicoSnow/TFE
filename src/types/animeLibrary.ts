export type AnimeListStatus = 'planned' | 'watching' | 'paused' | 'completed'

export type UserAnimeLibraryRow = {
  id: string
  user_id: string
  anilist_id: number
  status: AnimeListStatus
  sort_order: number
  created_at: string
  updated_at: string
}

export type LibraryAnimeItem = {
  libraryId: string
  anilistId: number
  title: string
  rating: string | null
  poster: string
}
