export type CatalogSectionVariant =
  | 'trending-year'
  | 'trending-all-time'
  | 'upcoming'

type CatalogSectionOptions = {
  /** Sans la classe `.grid` (ex. section similaire dans la page single). */
  embedded?: boolean
}

export type CatalogSectionProps =
  | ({ variant: CatalogSectionVariant } & CatalogSectionOptions)
  | ({ variant: 'tag'; tag: string } & CatalogSectionOptions)
  | ({ variant: 'similar'; anilistId: number; genres: string[] } & CatalogSectionOptions)
