const ANILIST_GRAPHQL_ENDPOINT = 'https://graphql.anilist.co'

type AnilistGraphqlError = {
  message: string
}

type AnilistGraphqlResponse<TData> = {
  data?: TData
  errors?: AnilistGraphqlError[]
}

export type AnilistAnime = {
  id: number
  title: {
    romaji: string | null
    english: string | null
    native: string | null
  }
  coverImage: {
    large: string | null
    color: string | null
  }
  averageScore: number | null
  episodes: number | null
  seasonYear: number | null
  siteUrl: string | null
}

type SearchAnimeData = {
  Media: AnilistAnime | null
}

const SEARCH_ANIME_BY_NAME_QUERY = `
  query SearchAnimeByName($search: String) {
    Media(search: $search, type: ANIME) {
      id
      title {
        romaji
        english
        native
      }
      coverImage {
        large
        color
      }
      averageScore
      episodes
      seasonYear
      siteUrl
    }
  }
`

export async function anilistRequest<TData>(
  query: string,
  variables?: Record<string, unknown>,
) {
  const response = await fetch(ANILIST_GRAPHQL_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({ query, variables }),
  })

  const result = (await response.json()) as AnilistGraphqlResponse<TData>

  if (!response.ok || result.errors?.length) {
    const message = result.errors?.[0]?.message ?? 'AniList request failed'
    throw new Error(message)
  }

  if (!result.data) {
    throw new Error('AniList returned no data')
  }

  return result.data
}

export async function searchAnimeByName(search: string) {
  const data = await anilistRequest<SearchAnimeData>(SEARCH_ANIME_BY_NAME_QUERY, {
    search: search.trim() || undefined,
  })

  return data.Media
}
