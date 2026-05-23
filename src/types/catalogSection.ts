export type CatalogSectionVariant =
  | 'trending-year'
  | 'trending-all-time'
  | 'upcoming'

export type CatalogSectionProps =
  | { variant: CatalogSectionVariant }
  | { variant: 'tag'; tag: string }
  | { variant: 'similar'; anilistId: number; genres: string[] }
