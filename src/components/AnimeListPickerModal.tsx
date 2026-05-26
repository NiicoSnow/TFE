import { useEffect } from 'react'
import { ANIME_LIST_LABELS_ORDERED, ANIME_LIST_STATUSES, statusToCategoryIndex } from '../lib/animeLibrary'
import type { AnimeListStatus } from '../types/animeLibrary'

type AnimeListPickerModalProps = {
  title: string
  animeTitle?: string
  currentStatus?: AnimeListStatus | null
  onSelect: (status: AnimeListStatus) => void
  onClose: () => void
  busy?: boolean
}

export function AnimeListPickerModal({
  title,
  animeTitle,
  currentStatus,
  onSelect,
  onClose,
  busy = false,
}: AnimeListPickerModalProps) {
  const currentIndex =
    currentStatus != null ? statusToCategoryIndex(currentStatus) : -1

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !busy) onClose()
    }
    window.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [onClose, busy])

  return (
    <div className="anime-management__modal-root">
      <button type="button" className="anime-management__modal-backdrop" aria-label="Fermer" onClick={onClose} disabled={busy} />
      <div className="anime-management__modal" role="dialog" aria-modal="true" aria-labelledby="anime-list-picker-title">
        <h3 id="anime-list-picker-title" className="anime-management__modal-title">{title}</h3>
        {animeTitle ? <p className="anime-management__modal-anime">{animeTitle}</p> : null}
        <ul className="anime-management__modal-list">
          {ANIME_LIST_STATUSES.map((status, i) => (
            <li key={status}>
              <button
                type="button"
                className="anime-management__modal-option"
                disabled={busy || i === currentIndex}
                onClick={() => onSelect(status)}
              >
                {ANIME_LIST_LABELS_ORDERED[i]}
                {i === currentIndex ? <span className="anime-management__modal-current"> (actuelle)</span> : null}
              </button>
            </li>
          ))}
        </ul>
        <button type="button" className="anime-management__modal-cancel" onClick={onClose} disabled={busy}>Annuler</button>
      </div>
    </div>
  )
}
