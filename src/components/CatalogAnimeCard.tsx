import { useEffect, useRef, useState, type CSSProperties, type MouseEvent, type PointerEvent } from 'react'
import { createPortal } from 'react-dom'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useMediaQuery } from '../hooks/useMediaQuery'
import { displayTitle, formatAnilistScore, getQueryErrorMessage } from '../lib/animeCache'
import { ANIME_LIST_LABELS, getLibraryStatusForAnime, setAnimeListStatus } from '../lib/animeLibrary'
import { publicAsset } from '../lib/publicPath'
import { AnimeListPickerModal } from './AnimeListPickerModal'
import type { AnimeCacheSummary } from '../types/animeCache'
import type { AnimeListStatus } from '../types/animeLibrary'

const POSTER_FALLBACK =
  'https://placehold.co/126x176/1e293b/9ca3af?text=Poster'

const CHARGE_MS = 1500
const DESKTOP_CATALOG_MQ = '(min-width: 1024px)'
const LONG_PRESS_MOVE_THRESHOLD_PX = 12
const CLAIM_GESTURE_MS = 80

export type CatalogAnimeCardProps = {
  anime: AnimeCacheSummary
  expandEnabled?: boolean
  isExpanded?: boolean
  expandWide?: boolean
  onExpandRequest?: (anilistId: number) => void
  onCollapse?: () => void
}

export function CatalogAnimeCard({
  anime,
  expandEnabled = false,
  isExpanded = false,
  expandWide = false,
  onExpandRequest,
  onCollapse,
}: CatalogAnimeCardProps) {
  const navigate = useNavigate()
  const isDesktop = useMediaQuery(DESKTOP_CATALOG_MQ)
  const { user, loading: authLoading } = useAuth()
  const [charging, setCharging] = useState(false)
  const [ringProgress, setRingProgress] = useState(0)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [currentStatus, setCurrentStatus] = useState<AnimeListStatus | null>(null)
  const [listBusy, setListBusy] = useState(false)

  const posterLinkRef = useRef<HTMLAnchorElement>(null)
  const pickerOpenRef = useRef(false)
  const chargeTimerRef = useRef<number | null>(null)
  const chargeRafRef = useRef<number | null>(null)
  const claimTimerRef = useRef<number | null>(null)
  const ignoreLeaveUntilRef = useRef(0)
  const pointerStartRef = useRef<{ x: number; y: number } | null>(null)
  const activePointerIdRef = useRef<number | null>(null)
  const gestureClaimedRef = useRef(false)
  const chargingRef = useRef(false)
  const expandedRef = useRef(isExpanded)
  const suppressNavRef = useRef(false)

  const title = displayTitle(anime)
  const poster = anime.cover_url ?? POSTER_FALLBACK
  const score = formatAnilistScore(anime.average_score)
  const studios = (anime.studios ?? []).map((studio) => studio.name).filter(Boolean)
  const genres = anime.genres ?? []
  const year = anime.season_year
  const episodes = anime.episodes
  const showDesktopExpand = isExpanded && isDesktop
  const showMobileOverlay = isExpanded && !isDesktop

  chargingRef.current = charging
  expandedRef.current = isExpanded

  const clearChargeTimer = () => {
    if (chargeTimerRef.current != null) {
      window.clearTimeout(chargeTimerRef.current)
      chargeTimerRef.current = null
    }
  }

  const clearChargeRaf = () => {
    if (chargeRafRef.current != null) {
      window.cancelAnimationFrame(chargeRafRef.current)
      chargeRafRef.current = null
    }
  }

  const clearClaimTimer = () => {
    if (claimTimerRef.current != null) {
      window.clearTimeout(claimTimerRef.current)
      claimTimerRef.current = null
    }
  }

  const stopCharging = () => {
    clearChargeTimer()
    clearChargeRaf()
    clearClaimTimer()
    gestureClaimedRef.current = false
    chargingRef.current = false
    setCharging(false)
    setRingProgress(0)
  }

  useEffect(() => () => {
    clearChargeTimer()
    clearChargeRaf()
    clearClaimTimer()
  }, [])

  useEffect(() => {
    if (!expandEnabled || isExpanded) {
      clearChargeTimer()
      clearChargeRaf()
      clearClaimTimer()
      gestureClaimedRef.current = false
      chargingRef.current = false
      setCharging(false)
      setRingProgress(0)
    }
  }, [expandEnabled, isExpanded])

  useEffect(() => {
    if (isExpanded) {
      ignoreLeaveUntilRef.current = Date.now() + 220
    }
  }, [isExpanded])

  useEffect(() => {
    if (!isExpanded || !user) {
      if (!isExpanded) setCurrentStatus(null)
      return
    }

    let cancelled = false
    void getLibraryStatusForAnime(user.id, anime.anilist_id)
      .then((status) => {
        if (!cancelled) setCurrentStatus(status)
      })
      .catch(() => {
        if (!cancelled) setCurrentStatus(null)
      })

    return () => {
      cancelled = true
    }
  }, [isExpanded, user, anime.anilist_id])

  useEffect(() => {
    if (!showMobileOverlay) return

    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !pickerOpenRef.current) onCollapse?.()
    }
    window.addEventListener('keydown', onKey)

    return () => {
      document.body.style.overflow = prevOverflow
      window.removeEventListener('keydown', onKey)
    }
  }, [showMobileOverlay, onCollapse])

  useEffect(() => {
    const el = posterLinkRef.current
    if (!el || isDesktop || !expandEnabled) return

    const blockNative = (event: Event) => {
      event.preventDefault()
    }

    const onTouchMove = (event: TouchEvent) => {
      if (!gestureClaimedRef.current) return
      event.preventDefault()
    }

    el.addEventListener('contextmenu', blockNative)
    el.addEventListener('dragstart', blockNative)
    el.addEventListener('selectstart', blockNative)
    el.addEventListener('touchmove', onTouchMove, { passive: false })

    return () => {
      el.removeEventListener('contextmenu', blockNative)
      el.removeEventListener('dragstart', blockNative)
      el.removeEventListener('selectstart', blockNative)
      el.removeEventListener('touchmove', onTouchMove)
    }
  }, [isDesktop, expandEnabled])

  const beginCharge = () => {
    if (!expandEnabled || expandedRef.current || chargingRef.current || pickerOpenRef.current) return

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const delay = reducedMotion ? 0 : CHARGE_MS

    chargingRef.current = true
    setCharging(true)
    setRingProgress(reducedMotion ? 1 : 0)
    clearChargeTimer()
    clearChargeRaf()

    if (!reducedMotion) {
      const startedAt = performance.now()
      const tick = (now: number) => {
        const progress = Math.min(1, (now - startedAt) / CHARGE_MS)
        setRingProgress(progress)
        if (progress < 1) {
          chargeRafRef.current = window.requestAnimationFrame(tick)
        } else {
          chargeRafRef.current = null
        }
      }
      chargeRafRef.current = window.requestAnimationFrame(tick)
    }

    chargeTimerRef.current = window.setTimeout(() => {
      chargeTimerRef.current = null
      clearChargeRaf()
      setRingProgress(1)
      chargingRef.current = false
      setCharging(false)
      if (!window.matchMedia(DESKTOP_CATALOG_MQ).matches) {
        suppressNavRef.current = true
      }
      onExpandRequest?.(anime.anilist_id)
    }, delay)
  }

  const handlePointerEnter = () => {
    if (!isDesktop) return
    beginCharge()
  }

  const handlePointerLeave = () => {
    if (!isDesktop) return
    if (pickerOpenRef.current) return
    if (Date.now() < ignoreLeaveUntilRef.current) return
    if (isExpanded) {
      onCollapse?.()
      return
    }
    stopCharging()
  }

  const releasePointerCapture = (target: HTMLElement) => {
    const pointerId = activePointerIdRef.current
    if (pointerId != null && target.hasPointerCapture?.(pointerId)) {
      try {
        target.releasePointerCapture(pointerId)
      } catch {
        // ignore
      }
    }
    activePointerIdRef.current = null
  }

  const handleMobilePointerDown = (event: PointerEvent<HTMLAnchorElement>) => {
    if (isDesktop || !expandEnabled) return
    if (event.pointerType === 'mouse') return

    pointerStartRef.current = { x: event.clientX, y: event.clientY }
    gestureClaimedRef.current = false
    activePointerIdRef.current = event.pointerId

    clearClaimTimer()
    claimTimerRef.current = window.setTimeout(() => {
      claimTimerRef.current = null
      if (!chargingRef.current || expandedRef.current || !pointerStartRef.current) return

      gestureClaimedRef.current = true
      const el = posterLinkRef.current
      const pointerId = activePointerIdRef.current
      if (el && pointerId != null) {
        try {
          el.setPointerCapture(pointerId)
        } catch {
          // ignore
        }
      }
    }, CLAIM_GESTURE_MS)

    beginCharge()
  }

  const handleMobilePointerMove = (event: PointerEvent<HTMLAnchorElement>) => {
    if (isDesktop || !expandEnabled) return
    if (!chargingRef.current || !pointerStartRef.current) return

    const dx = event.clientX - pointerStartRef.current.x
    const dy = event.clientY - pointerStartRef.current.y
    if (Math.hypot(dx, dy) > LONG_PRESS_MOVE_THRESHOLD_PX) {
      pointerStartRef.current = null
      gestureClaimedRef.current = false
      releasePointerCapture(event.currentTarget)
      stopCharging()
    }
  }

  const handleMobilePointerEnd = (event: PointerEvent<HTMLAnchorElement>) => {
    if (isDesktop || !expandEnabled) return

    releasePointerCapture(event.currentTarget)
    pointerStartRef.current = null
    clearClaimTimer()
    gestureClaimedRef.current = false

    if (pickerOpenRef.current) return
    if (!expandedRef.current) stopCharging()
  }

  const handlePosterClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (suppressNavRef.current) {
      event.preventDefault()
      suppressNavRef.current = false
      return
    }
    stopCharging()
  }

  const openListPicker = async (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault()
    event.stopPropagation()
    if (authLoading) return
    if (!user) {
      navigate('/profil')
      return
    }

    pickerOpenRef.current = true
    setPickerOpen(true)

    try {
      const status = await getLibraryStatusForAnime(user.id, anime.anilist_id)
      setCurrentStatus(status)
    } catch {
      setCurrentStatus(null)
    }
  }

  const handleListSelect = async (status: AnimeListStatus) => {
    if (!user) return
    setListBusy(true)
    try {
      await setAnimeListStatus(user.id, anime.anilist_id, status)
      setCurrentStatus(status)
      pickerOpenRef.current = false
      setPickerOpen(false)
    } catch (err) {
      console.error(getQueryErrorMessage(err, 'Ajout à la liste échoué'))
    } finally {
      setListBusy(false)
    }
  }

  const infoPanel = (
    <>
      <button
        type="button"
        className="catalog-anime-card__add"
        aria-label={
          currentStatus
            ? `Dans la liste : ${ANIME_LIST_LABELS[currentStatus]}. Changer`
            : 'Ajouter à une liste'
        }
        onClick={openListPicker}
      >
        <img
          src={
            currentStatus
              ? publicAsset('assets/inlist.svg')
              : publicAsset('assets/adding.svg')
          }
          alt=""
          width={40}
          height={40}
        />
      </button>
      <Link to={`/catalogue/anime/${anime.anilist_id}`} className="catalog-anime-card__panel-main">
        <div className="catalog-anime-card__head">
          <h3 className="catalog-anime-card__title">{title}</h3>
          {studios.length > 0 ? (
            <p className="catalog-anime-card__studios">Par {studios.join(', ')}</p>
          ) : null}
          {year != null ? (
            <p className="catalog-anime-card__year">{year}</p>
          ) : null}
        </div>
        <div className="catalog-anime-card__bottom">
          {genres.length > 0 ? (
            <p className="catalog-anime-card__genres">{genres.join(', ')}</p>
          ) : null}
          <p className="catalog-anime-card__episodes">
            {episodes != null
              ? `${episodes} épisodes`
              : 'Épisodes\u00A0—'}
          </p>
        </div>
      </Link>
      {score ? (
        <p className="catalog-anime-card__score">
          <span className="catalog-anime-card__score-value">{score}</span>
          <span className="catalog-anime-card__score-suffix">/10</span>
        </p>
      ) : null}
    </>
  )

  const className = [
    'catalog-anime-card',
    expandEnabled ? 'catalog-anime-card--interactive' : null,
    charging ? 'catalog-anime-card--charging' : null,
    showDesktopExpand ? 'catalog-anime-card--expanded' : null,
    showDesktopExpand && expandWide ? 'catalog-anime-card--wide' : null,
    showMobileOverlay ? 'catalog-anime-card--mobile-open' : null,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <>
      <article
        className={className}
        onPointerEnter={expandEnabled && isDesktop ? handlePointerEnter : undefined}
        onPointerLeave={expandEnabled && isDesktop ? handlePointerLeave : undefined}
      >
        <div className="catalog-anime-card__shell">
          <div className="catalog-anime-card__poster-col">
            <Link
              ref={posterLinkRef}
              to={`/catalogue/anime/${anime.anilist_id}`}
              className="catalog-anime-card__poster-link"
              aria-label={title}
              draggable={false}
              onClick={handlePosterClick}
              onPointerDown={expandEnabled && !isDesktop ? handleMobilePointerDown : undefined}
              onPointerMove={expandEnabled && !isDesktop ? handleMobilePointerMove : undefined}
              onPointerUp={expandEnabled && !isDesktop ? handleMobilePointerEnd : undefined}
              onPointerCancel={expandEnabled && !isDesktop ? handleMobilePointerEnd : undefined}
              onContextMenu={expandEnabled && !isDesktop ? (event) => event.preventDefault() : undefined}
            >
              <figure className="catalog-theme-section__poster catalog-anime-card__poster">
                <img src={poster} alt="" loading="lazy" draggable={false} />
              </figure>
              {expandEnabled ? (
                <span
                  className="catalog-anime-card__ring"
                  style={{ '--ring-progress': ringProgress } as CSSProperties}
                  aria-hidden
                />
              ) : null}
            </Link>
            {!showDesktopExpand ? (
              <div className="catalog-theme-section__meta">
                <h5 className="catalog-theme-section__card-title">{title}</h5>
              </div>
            ) : null}
          </div>

          {showDesktopExpand ? (
            <div className="catalog-anime-card__panel">{infoPanel}</div>
          ) : null}
        </div>
      </article>

      {showMobileOverlay
        ? createPortal(
            <div
              className="catalog-anime-card-mobile"
              role="dialog"
              aria-modal="true"
              aria-label={title}
            >
              <button
                type="button"
                className="catalog-anime-card-mobile__backdrop"
                aria-label="Fermer"
                onClick={() => onCollapse?.()}
              />
              <div className="catalog-anime-card-mobile__stage">
                <figure className="catalog-anime-card-mobile__poster">
                  <img src={poster} alt="" draggable={false} />
                </figure>
              </div>
              <div className="catalog-anime-card-mobile__sheet">
                {infoPanel}
              </div>
            </div>,
            document.body,
          )
        : null}

      {pickerOpen ? (
        <AnimeListPickerModal
          title={'Ajouter à une\u00A0liste'}
          animeTitle={title}
          currentStatus={currentStatus}
          onSelect={(status) => void handleListSelect(status)}
          onClose={() => {
            pickerOpenRef.current = false
            setPickerOpen(false)
          }}
          busy={listBusy}
        />
      ) : null}
    </>
  )
}
