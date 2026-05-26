import { Fragment, useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { ANIME_LIST_LABELS_ORDERED, categoryIndexToStatus, fetchUserLibraryByCategory, getQueryErrorMessage, setAnimeListStatus, setLibraryPublic, statusToCategoryIndex } from '../lib/animeLibrary'
import type { AnimeListStatus, LibraryAnimeItem } from '../types/animeLibrary'
import { AnimeListPickerModal } from './AnimeListPickerModal'

const EMPTY_LISTS: LibraryAnimeItem[][] = [[], [], [], []]

type MoveContext = {
  fromIndex: number
  anime: LibraryAnimeItem
}

type AnimeManagtSectionProps = {
  libraryUserId?: string
  readOnly?: boolean
  heading?: string
  embedded?: boolean
  libraryPublic?: boolean
  ownerDisplayName?: string
}

export function AnimeManagtSection({
  libraryUserId,
  readOnly = false,
  heading = 'Gestion des animes',
  embedded = false,
  libraryPublic: libraryPublicProp = true,
  ownerDisplayName,
}: AnimeManagtSectionProps = {}) {
  const { user: authUser, profile, updateProfile, loading: authLoading } = useAuth()
  const userId = libraryUserId ?? authUser?.id
  const isOwner = !readOnly && Boolean(authUser?.id) && userId === authUser?.id

  const [lists, setLists] = useState<LibraryAnimeItem[][]>(EMPTY_LISTS)
  const [libraryLoading, setLibraryLoading] = useState(false)
  const [libraryError, setLibraryError] = useState<string | null>(null)
  const [categoryIndex, setCategoryIndex] = useState(0)
  const [moveTarget, setMoveTarget] = useState<MoveContext | null>(null)
  const [moveBusy, setMoveBusy] = useState(false)
  const [libraryPublic, setLibraryPublicState] = useState(true)
  const [visibilityBusy, setVisibilityBusy] = useState(false)

  const canShowLibrary = isOwner || (readOnly && libraryPublicProp)

  useEffect(() => {
    if (isOwner) {
      setLibraryPublicState(profile?.library_public ?? true)
    } else if (readOnly) {
      setLibraryPublicState(libraryPublicProp)
    }
  }, [isOwner, readOnly, profile?.library_public, libraryPublicProp])

  const loadLibrary = useCallback(async () => {
    if (!userId || !canShowLibrary) {
      setLists(EMPTY_LISTS)
      if (!canShowLibrary) setLibraryError(null)
      return
    }

    setLibraryLoading(true)
    setLibraryError(null)
    try {
      const grouped = await fetchUserLibraryByCategory(userId)
      setLists(grouped)
    } catch (err) {
      setLibraryError(
        getQueryErrorMessage(
          err,
          readOnly ? 'Impossible de charger les listes' : 'Impossible de charger tes listes',
        ),
      )
      setLists(EMPTY_LISTS)
    } finally {
      setLibraryLoading(false)
    }
  }, [userId, readOnly, canShowLibrary])

  useEffect(() => {
    if (authLoading) return
    void loadLibrary()
  }, [authLoading, loadLibrary])

  const n = ANIME_LIST_LABELS_ORDERED.length
  const currentLabel = ANIME_LIST_LABELS_ORDERED[categoryIndex]
  const items = lists[categoryIndex] ?? []

  const goPrev = () => setCategoryIndex((i) => (i - 1 + n) % n)
  const goNext = () => setCategoryIndex((i) => (i + 1) % n)

  const openMovePicker = (anime: LibraryAnimeItem) => {
    setMoveTarget({ fromIndex: categoryIndex, anime })
  }

  const confirmMoveTo = async (status: AnimeListStatus) => {
    if (!moveTarget || !userId || readOnly) return

    const toIndex = statusToCategoryIndex(status)
    if (toIndex === moveTarget.fromIndex) {
      setMoveTarget(null)
      return
    }

    setMoveBusy(true)
    try {
      await setAnimeListStatus(userId, moveTarget.anime.anilistId, status)
      setLists((prev) => {
        const next = prev.map((arr) => [...arr])
        const { fromIndex, anime } = moveTarget
        next[fromIndex] = next[fromIndex].filter((a) => a.libraryId !== anime.libraryId)
        next[toIndex] = [...next[toIndex], anime]
        return next
      })
      setMoveTarget(null)
    } catch (err) {
      setLibraryError(getQueryErrorMessage(err, 'Impossible de déplacer cet anime'))
    } finally {
      setMoveBusy(false)
    }
  }

  const toggleLibraryVisibility = async () => {
    if (!authUser?.id || !isOwner) return

    setVisibilityBusy(true)
    setLibraryError(null)
    const next = !libraryPublic
    try {
      await setLibraryPublic(authUser.id, next)
      setLibraryPublicState(next)
      await updateProfile({ library_public: next })
    } catch (err) {
      setLibraryError(
        getQueryErrorMessage(err, 'Impossible de modifier la visibilité des listes'),
      )
    } finally {
      setVisibilityBusy(false)
    }
  }

  const currentMoveStatus =
    moveTarget != null ? categoryIndexToStatus(moveTarget.fromIndex) : null

  const sectionClassName = embedded ? 'anime-management' : 'anime-management grid'
  const privateOwnerLabel = ownerDisplayName?.trim() || 'Cet utilisateur'
  const showLibraryContent = userId && canShowLibrary && !libraryLoading

  return (
    <section className={sectionClassName}>
      <div className="anime-management__heading">
        <h3>{heading}</h3>
        {isOwner ? (
          <button
            type="button"
            className="anime-management__visibility"
            onClick={() => void toggleLibraryVisibility()}
            disabled={visibilityBusy}
            aria-label={
              libraryPublic
                ? 'Tes listes sont visibles par tes amis. Cliquer pour les rendre privées.'
                : 'Tes listes sont privées. Cliquer pour les rendre visibles par tes amis.'
            }
            aria-pressed={libraryPublic}
          >
            <img
              className="anime-management__visibility-icon"
              src={libraryPublic ? '/visible.svg' : '/notvisible.svg'}
              alt=""
              width={24}
              height={16}
            />
          </button>
        ) : null}
      </div>

      <div className="anime-management__element">
        {!readOnly && !authLoading && !authUser ? (
          <p className="anime-management__status">
            <Link to="/profil">Connecte-toi</Link> pour gérer tes listes d&apos;animes.
          </p>
        ) : null}

        {readOnly && !userId ? (
          <p className="anime-management__status">Profil introuvable.</p>
        ) : null}

        {readOnly && userId && !libraryPublicProp ? (
          <p className="anime-management__status anime-management__status--private">
            {privateOwnerLabel} a mis sa liste en privé.
          </p>
        ) : null}

        {libraryError ? (
          <p className="anime-management__status anime-management__status--error">{libraryError}</p>
        ) : null}

        {authLoading || (userId && canShowLibrary && libraryLoading) ? (
          <p className="anime-management__status">
            {readOnly ? 'Chargement des listes…' : 'Chargement de tes listes…'}
          </p>
        ) : null}

        {showLibraryContent ? (
          <>
            <div className="anime-management__nav anime-management__nav--mobile">
              <button type="button" className="anime-management__arrow" onClick={goPrev} aria-label="Catégorie précédente">
                <img src="/fleche.svg" alt="" className="anime-management__arrow-icon anime-management__arrow-icon--left" width={17} height={27} />
              </button>
              <p className="anime-management__category-title" aria-live="polite">{currentLabel}</p>
              <button type="button" className="anime-management__arrow" onClick={goNext} aria-label="Catégorie suivante">
                <img src="/fleche.svg" alt="" className="anime-management__arrow-icon" width={17} height={27} />
              </button>
            </div>

            <nav className="anime-management__nav anime-management__nav--desktop" aria-label="Catégories de listes">
              {ANIME_LIST_LABELS_ORDERED.map((label, i) => (
                <Fragment key={label}>
                  {i > 0 ? <span className="anime-management__tab-sep" aria-hidden>|</span> : null}
                  <button type="button" className={i === categoryIndex ? 'anime-management__tab anime-management__tab--active' : 'anime-management__tab'} onClick={() => setCategoryIndex(i)}>{label}</button>
                </Fragment>
              ))}
            </nav>

            <div className="anime-management__divider" aria-hidden />

            <ul className="anime-management__list">
              {items.length === 0 ? (
                <li className="anime-management__empty">Aucun anime dans cette liste.</li>
              ) : (
                items.map((anime) => (
                  <li key={anime.libraryId} className="anime-management__card">
                    <Link to={`/catalogue/anime/${anime.anilistId}`} className="anime-management__poster-link">
                      <img className="anime-management__poster" src={anime.poster} alt="" />
                    </Link>
                    <div className="anime-management__info">
                      <h3 className="anime-management__anime-title">
                        <Link to={`/catalogue/anime/${anime.anilistId}`} className="anime-management__title-link">{anime.title}</Link>
                      </h3>
                      {anime.rating ? (
                        <p className="anime-management__rating">
                          <span className="anime-management__rating-value">{anime.rating}</span>
                          <span className="anime-management__rating-max">/10</span>
                        </p>
                      ) : null}
                      {!readOnly ? (
                        <button type="button" className="anime-management__changer" onClick={() => openMovePicker(anime)}>Changer</button>
                      ) : null}
                    </div>
                    {!readOnly ? (
                      <button type="button" className="anime-management__move-btn" onClick={() => openMovePicker(anime)} aria-label={`Changer de liste pour ${anime.title}`}>
                        <img className="anime-management__icon-slot" src="/switch.svg" alt="" width={30} height={30} />
                      </button>
                    ) : null}
                  </li>
                ))
              )}
            </ul>
          </>
        ) : null}
      </div>

      {!readOnly && moveTarget ? (
        <AnimeListPickerModal
          title="Déplacer vers une liste"
          animeTitle={moveTarget.anime.title}
          currentStatus={currentMoveStatus}
          onSelect={(status) => void confirmMoveTo(status)}
          onClose={() => !moveBusy && setMoveTarget(null)}
          busy={moveBusy}
        />
      ) : null}
    </section>
  )
}
