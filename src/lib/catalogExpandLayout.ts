export const CATALOG_EXPAND_SPAN_DEFAULT = 3
export const CATALOG_EXPAND_SPAN_WIDE = 4
export const CATALOG_EXPAND_SPAN = CATALOG_EXPAND_SPAN_DEFAULT

/** Titles longer than this use 4 cols instead of 3. */
const WIDE_TITLE_MIN_CHARS = 28

export type CatalogExpandSlot<T> = {
  item: T
  expanded: boolean
  wide?: boolean
}

export function getCatalogExpandSpan(title: string): number {
  return title.trim().length >= WIDE_TITLE_MIN_CHARS
    ? CATALOG_EXPAND_SPAN_WIDE
    : CATALOG_EXPAND_SPAN_DEFAULT
}

/**
 * Rebuilds one row so an expanded card fits.
 * Default = poster + 2 info cols (3). Wide = poster + 3 info cols (4).
 * If there is no room on the right, the card shifts left and
 * overflowing neighbors on that row are temporarily omitted.
 */
export function layoutCatalogExpandRow<T>(
  items: T[],
  expandedIndex: number | null,
  columns: number,
  expandSpan = CATALOG_EXPAND_SPAN_DEFAULT,
): CatalogExpandSlot<T>[] {
  if (expandedIndex == null || columns < expandSpan) {
    return items.map((item) => ({ item, expanded: false }))
  }

  const safeIndex = Math.max(0, Math.min(expandedIndex, items.length - 1))
  const row = Math.floor(safeIndex / columns)
  const col = safeIndex % columns
  const rowStart = row * columns
  const rowEnd = Math.min(rowStart + columns, items.length)
  const startCol = Math.min(col, columns - expandSpan)
  const leftSlots = startCol
  const rightSlots = columns - expandSpan - leftSlots
  const wide = expandSpan >= CATALOG_EXPAND_SPAN_WIDE

  const before = items.slice(rowStart, safeIndex)
  const after = items.slice(safeIndex + 1, rowEnd)
  const leftItems = before.slice(0, leftSlots)
  const rightItems = after.slice(0, rightSlots)

  return [
    ...items.slice(0, rowStart).map((item) => ({ item, expanded: false })),
    ...leftItems.map((item) => ({ item, expanded: false })),
    { item: items[safeIndex], expanded: true, wide },
    ...rightItems.map((item) => ({ item, expanded: false })),
    ...items.slice(rowEnd).map((item) => ({ item, expanded: false })),
  ]
}
