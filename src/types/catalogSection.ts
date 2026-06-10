export type CatalogSectionVariant =
  | 'trending-year'
  | 'trending-all-time'
  | 'upcoming'

type CatalogSectionOptions = {
  embedded?: boolean
}

export type CatalogSectionProps =
  | ({ variant: CatalogSectionVariant } & CatalogSectionOptions)
  | ({ variant: 'tag'; tag: string } & CatalogSectionOptions)
  | ({ variant: 'similar'; anilistId: number; genres: string[] } & CatalogSectionOptions)
