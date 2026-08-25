import { Fragment, useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { ANIME_LIST_LABELS_ORDERED, categoryIndexToStatus, fetchUserLibraryByCategory, getQueryErrorMessage, removeAnimeFromLibrary, setAnimeListStatus, setLibraryPublic, statusToCategoryIndex } from '../lib/animeLibrary'
import { publicAsset } from '../lib/publicPath'
import { useMediaQuery } from '../hooks/useMediaQuery'
import type { AnimeListStatus, LibraryAnimeItem } from '../types/animeLibrary'
import { AnimeListPickerModal } from './AnimeListPickerModal'

const EMPTY_LISTS: LibraryAnimeItem[][] = [[], [], [], []]
const LIBRARY_PAGE_SIZE = 8

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
  heading = 'Gestion des\u00A0animes',
  embedded = false,
  libraryPublic: libraryPublicProp = true,
  ownerDisplayName,
}: AnimeManagtSectionProps = {}) {
  const { user: authUser, profile, updateProfile, loading: authLoading } = useAuth()
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  const userId = libraryUserId ?? authUser?.id
  const isOwner = !readOnly && Boolean(authUser?.id) && userId === authUser?.id

  const [lists, setLists] = useState<LibraryAnimeItem[][]>(EMPTY_LISTS)
  const [libraryLoading, setLibraryLoading] = useState(false)
  const [libraryError, setLibraryError] = useState<string | null>(null)
  const [categoryIndex, setCategoryIndex] = useState(0)
  const [page, setPage] = useState(0)
  const [pageEditing, setPageEditing] = useState(false)
  const [pageDraft, setPageDraft] = useState('1')
  const [moveTarget, setMoveTarget] = useState<MoveContext | null>(null)
  const [moveBusy, setMoveBusy] = useState(false)
  const [libraryPublic, setLibraryPublicState] = useState(true)
  const [visibilityBusy, setVisibilityBusy] = useState(false)
  const pageInputRef = useRef<HTMLInputElement>(null)
  const listTopRef = useRef<HTMLDivElement>(null)

  const canShowLibrary = isOwner || (readOnly && libraryPublicProp)

  useEffect(() => {
    if (isOwner) {
      setLibraryPublicState(profile?.library_public ?? true)
    } else if (readOnly) {
      setLibraryPublicState(libraryPublicProp)
    }
  }, [isOwner, readOnly, profile?.library_public, libraryPublicProp])

  useEffect(() => {
    if (authLoading) return

    async function loadLibrary() {
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
            readOnly ? 'Erreur chargement listes' : 'Erreur chargement tes listes',
          ),
        )
        setLists(EMPTY_LISTS)
      } finally {
        setLibraryLoading(false)
      }
    }

    void loadLibrary()
  }, [authLoading, userId, readOnly, canShowLibrary])

  const n = ANIME_LIST_LABELS_ORDERED.length
  const currentLabel = ANIME_LIST_LABELS_ORDERED[categoryIndex]
  const items = lists[categoryIndex] ?? []
  const pageCount = Math.max(1, Math.ceil(items.length / LIBRARY_PAGE_SIZE))
  const safePage = Math.min(page, pageCount - 1)
  const pageItems = items.slice(
    safePage * LIBRARY_PAGE_SIZE,
    safePage * LIBRARY_PAGE_SIZE + LIBRARY_PAGE_SIZE,
  )
  const canGoPrevPage = safePage > 0
  const canGoNextPage = safePage < pageCount - 1 && items.length > 0

  useEffect(() => {
    if (!pageEditing) return
    const input = pageInputRef.current
    if (!input) return
    input.focus()
    input.select()
  }, [pageEditing])

  const goPrev = () => {
    setPage(0)
    setPageEditing(false)
    setCategoryIndex((i) => (i - 1 + n) % n)
  }
  const goNext = () => {
    setPage(0)
    setPageEditing(false)
    setCategoryIndex((i) => (i + 1) % n)
  }

  const goToPage = (nextPage: number) => {
    const clamped = Math.min(Math.max(0, nextPage), pageCount - 1)
    setPage(clamped)
    setPageDraft(String(clamped + 1))
    listTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const commitPageDraft = () => {
    const parsed = Number.parseInt(pageDraft.trim(), 10)
    setPageEditing(false)
    if (!Number.isFinite(parsed)) {
      setPageDraft(String(safePage + 1))
      return
    }
    goToPage(parsed - 1)
  }

  const handlePageFormSubmit = (event: FormEvent) => {
    event.preventDefault()
    commitPageDraft()
  }

  const handlePageInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault()
      setPageDraft(String(safePage + 1))
      setPageEditing(false)
    }
  }

  const selectCategory = (index: number) => {
    setPage(0)
    setPageEditing(false)
    setCategoryIndex(index)
  }

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
      setLibraryError(getQueryErrorMessage(err, 'Déplacement échoué'))
    } finally {
      setMoveBusy(false)
    }
  }

  const confirmRemove = async (anime: LibraryAnimeItem, fromIndex: number) => {
    if (!userId || readOnly) return

    const confirmed = window.confirm(
      `Êtes-vous sûr de vouloir supprimer « ${anime.title} » de ta liste ?`,
    )
    if (!confirmed) return

    setMoveBusy(true)
    try {
      await removeAnimeFromLibrary(userId, anime.anilistId)
      setLists((prev) => {
        const next = prev.map((arr) => [...arr])
        next[fromIndex] = next[fromIndex].filter((a) => a.libraryId !== anime.libraryId)
        return next
      })
      setMoveTarget(null)
    } catch (err) {
      setLibraryError(getQueryErrorMessage(err, 'Suppression échouée'))
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
        getQueryErrorMessage(err, 'Visibilité non modifiée'),
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

  const visibilityControl = isOwner ? (
    <button
      type="button"
      className="anime-management__visibility-control"
      onClick={() => void toggleLibraryVisibility()}
      disabled={visibilityBusy}
      aria-label="Changer la visibilité des listes"
      aria-pressed={libraryPublic}
    >
      <span className="anime-management__visibility-label">
        {libraryPublic ? 'Masquer à tes amis' : 'Montrer à tes amis'}
      </span>
      <img
        className="anime-management__visibility-icon"
        src={libraryPublic ? publicAsset('assets/visible.svg') : publicAsset('assets/notvisible.svg')}
        alt=""
        width={24}
        height={16}
      />
    </button>
  ) : null

  const elementClassName = isOwner
    ? 'anime-management__element anime-management__element--owner'
    : 'anime-management__element'

  return (
    <section className={sectionClassName}>
      <h2 className="anime-management__heading">{heading}</h2>

      <div className={elementClassName}>
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
                <img src={publicAsset('assets/fleche.svg')} alt="" className="anime-management__arrow-icon anime-management__arrow-icon--left" width={17} height={27} />
              </button>
              <p className="anime-management__category-title" aria-live="polite">{currentLabel}</p>
              <button type="button" className="anime-management__arrow" onClick={goNext} aria-label="Catégorie suivante">
                <img src={publicAsset('assets/fleche.svg')} alt="" className="anime-management__arrow-icon" width={17} height={27} />
              </button>
            </div>

            <div className="anime-management__nav-row">
              <nav className="anime-management__nav anime-management__nav--desktop" aria-label="Catégories de listes">
                {ANIME_LIST_LABELS_ORDERED.map((label, i) => (
                  <Fragment key={label}>
                    {i > 0 ? <span className="anime-management__tab-sep" aria-hidden>|</span> : null}
                    <button type="button" className={i === categoryIndex ? 'anime-management__tab anime-management__tab--active' : 'anime-management__tab'} onClick={() => selectCategory(i)}>{label}</button>
                  </Fragment>
                ))}
              </nav>
              {visibilityControl ? (
                <div className="anime-management__visibility-slot anime-management__visibility-slot--desktop">
                  {visibilityControl}
                </div>
              ) : null}
            </div>

            <div className="anime-management__divider" aria-hidden />

            <div ref={listTopRef} />

            <ul className="anime-management__list">
              {items.length === 0 ? (
                <li className="anime-management__empty">Aucun anime dans cette liste.</li>
              ) : (
                pageItems.map((anime) => (
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
                      <>
                        <button
                          type="button"
                          className="anime-management__move-btn anime-management__move-btn--mobile"
                          onClick={() => openMovePicker(anime)}
                          aria-label={`Changer de liste pour ${anime.title}`}
                        >
                          <img className="anime-management__icon-slot" src={publicAsset('assets/switch.svg')} alt="" width={30} height={30} />
                        </button>
                        <button
                          type="button"
                          className="anime-management__move-btn anime-management__delete-btn"
                          onClick={() => void confirmRemove(anime, categoryIndex)}
                          disabled={moveBusy}
                          aria-label={`Retirer ${anime.title} de la liste`}
                        >
                          <img className="anime-management__icon-slot" src={publicAsset('assets/delete.svg')} alt="" width={30} height={30} />
                        </button>
                      </>
                    ) : null}
                  </li>
                ))
              )}
            </ul>

            {items.length > LIBRARY_PAGE_SIZE ? (
              <div className="catalogue-search__pagination anime-management__pagination">
                <button
                  type="button"
                  className="catalog-theme-section__nav catalogue-search__page-btn"
                  aria-label="Page précédente"
                  disabled={!canGoPrevPage}
                  onClick={() => goToPage(safePage - 1)}
                >
                  <img
                    src={publicAsset('assets/fleche.svg')}
                    alt=""
                    className="catalog-theme-section__nav-icon catalog-theme-section__nav-icon--left"
                    width={17}
                    height={27}
                  />
                </button>

                {pageEditing ? (
                  <form className="catalogue-search__page-form" onSubmit={handlePageFormSubmit}>
                    <label className="catalogue-search__page-edit">
                      <span className="catalogue-search__page-edit-prefix">Page</span>
                      <input
                        ref={pageInputRef}
                        type="number"
                        inputMode="numeric"
                        min={1}
                        max={pageCount}
                        className="catalogue-search__page-input"
                        value={pageDraft}
                        aria-label={`Aller à une page entre 1 et ${pageCount}`}
                        onChange={(event) => setPageDraft(event.target.value)}
                        onBlur={commitPageDraft}
                        onKeyDown={handlePageInputKeyDown}
                      />
                      <span className="catalogue-search__page-edit-suffix">/ {pageCount}</span>
                    </label>
                  </form>
                ) : (
                  <button
                    type="button"
                    className="catalogue-search__page-label"
                    aria-label={`Page ${safePage + 1} sur ${pageCount}. Cliquer pour choisir une page`}
                    onClick={() => {
                      setPageDraft(String(safePage + 1))
                      setPageEditing(true)
                    }}
                  >
                    Page {safePage + 1} / {pageCount}
                  </button>
                )}

                <button
                  type="button"
                  className="catalog-theme-section__nav catalogue-search__page-btn"
                  aria-label="Page suivante"
                  disabled={!canGoNextPage}
                  onClick={() => goToPage(safePage + 1)}
                >
                  <img
                    src={publicAsset('assets/fleche.svg')}
                    alt=""
                    className="catalog-theme-section__nav-icon"
                    width={17}
                    height={27}
                  />
                </button>
              </div>
            ) : null}

            {visibilityControl ? (
              <div className="anime-management__visibility-slot anime-management__visibility-slot--mobile">
                {visibilityControl}
              </div>
            ) : null}
          </>
        ) : null}
      </div>

      {!readOnly && moveTarget ? (
        <AnimeListPickerModal
          title={'Déplacer vers une\u00A0liste'}
          animeTitle={moveTarget.anime.title}
          currentStatus={currentMoveStatus}
          onSelect={(status) => void confirmMoveTo(status)}
          onDelete={
            !isDesktop
              ? () => void confirmRemove(moveTarget.anime, moveTarget.fromIndex)
              : undefined
          }
          onClose={() => !moveBusy && setMoveTarget(null)}
          busy={moveBusy}
        />
      ) : null}
    </section>
  )
}
