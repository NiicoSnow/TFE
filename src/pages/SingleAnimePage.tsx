import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { CatalogThemeSection } from '../components/CatalogThemeSection'
import {
  displayTitle,
  formatAnilistScore,
  formatSeasonRelease,
  getAnimeFromCache,
  getQueryErrorMessage,
} from '../lib/animeCache'
import { formatSynopsisForDisplay } from '../lib/synopsis'
import type { AnimeCacheRow } from '../types/animeCache'

const POSTER_FALLBACK =
  'https://placehold.co/126x176/1e293b/9ca3af?text=Poster'

function youtubeEmbedId(trailer: AnimeCacheRow['trailer']) {
  if (!trailer?.id || trailer.site !== 'youtube') return null
  return trailer.id
}

type MetaCellProps = {
  label: string
  value: string | null
  accent?: boolean
  valueSuffix?: string
}

function MetaCell({ label, value, accent, valueSuffix }: MetaCellProps) {
  if (!value) return null

  return (
    <div className="single-anime-page__meta-cell">
      <span className="single-anime-page__meta-label">{label}</span>
      <span
        className={
          accent
            ? 'single-anime-page__meta-value single-anime-page__meta-value--accent'
            : 'single-anime-page__meta-value'
        }
      >
        <span className="single-anime-page__meta-value-main">{value}</span>
        {valueSuffix ? (
          <span className="single-anime-page__meta-value-suffix">{valueSuffix}</span>
        ) : null}
      </span>
    </div>
  )
}

export function SingleAnimePage() {
  const { anilistId } = useParams()
  const [anime, setAnime] = useState<AnimeCacheRow | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const id = Number(anilistId)
    if (!Number.isFinite(id)) {
      setError('Identifiant invalide')
      setLoading(false)
      return
    }

    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)
      try {
        const row = await getAnimeFromCache(id)
        if (cancelled) return

        setAnime(row)
        if (!row) {
          setError('Anime introuvable')
          return
        }
      } catch (err) {
        if (!cancelled) {
          setError(getQueryErrorMessage(err, 'Impossible de charger cet anime'))
          setAnime(null)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [anilistId])

  const title = anime ? displayTitle(anime) : ''
  const score = anime ? formatAnilistScore(anime.average_score) : null
  const trailerId = anime ? youtubeEmbedId(anime.trailer) : null
  const bannerImage = anime?.banner_url ?? anime?.cover_url ?? null
  const seasonLabel = anime ? formatSeasonRelease(anime.season, anime.season_year) : null
  const episodesLabel =
    anime?.episodes != null ? `${anime.episodes} épisodes` : null
  const studiosLabel =
    anime && anime.studios.length > 0
      ? anime.studios.map((s) => s.name).join(', ')
      : null
  const producersLabel =
    anime && anime.producers.length > 0
      ? anime.producers.map((p) => p.name).join(', ')
      : null
  const genresLabel =
    anime && anime.genres.length > 0 ? anime.genres.join(', ') : null
  const watchLinks =
    anime?.watch_links.filter((link) => !link.isDisabled && link.url) ?? []

  return (
    <main className="single-anime-page">
      {!loading && !error && anime ? (
        <header className="single-anime-page__header">
          <div className="single-anime-page__banner-wrap">
            {bannerImage ? (
              <div
                className="single-anime-page__banner"
                style={{ backgroundImage: `url(${bannerImage})` }}
                role="img"
                aria-hidden
              />
            ) : null}
            <Link to="/catalogue" className="single-anime-page__back" aria-label="Retour au catalogue">
              <img
                src="/fleche.svg"
                alt=""
                className="single-anime-page__back-icon"
                width={17}
                height={27}
              />
            </Link>
          </div>
          <img
            className="single-anime-page__poster"
            src={anime.cover_url ?? POSTER_FALLBACK}
            alt=""
          />
        </header>
      ) : null}

      <div className="single-anime-page__body">
        {loading ? <p className="single-anime-page__status">Chargement…</p> : null}
        {error ? (
          <p className="single-anime-page__status single-anime-page__status--error">{error}</p>
        ) : null}

        {!loading && !error && anime ? (
          <>
            <div className="single-anime-page__heading">
              <h2 className="single-anime-page__title">{title}</h2>
              <button type="button" className="single-anime-page__add" aria-label="Ajouter à une liste">
                <img src="/adding.svg" alt="" width={40} height={40} />
              </button>
            </div>

            <div className="single-anime-page__meta">
              <MetaCell label={anime.format ?? 'Format'} value={episodesLabel} />
              <MetaCell label="Année de sortie" value={seasonLabel} />
              <MetaCell label="Studios" value={studiosLabel} />
              <MetaCell label="Producteurs" value={producersLabel} />
              <MetaCell label="Note" value={score} accent valueSuffix="/10" />
              <MetaCell label="Genres" value={genresLabel} />
            </div>

            {anime.synopsis ? (
              <section className="single-anime-page__section">
                <h2 className="single-anime-page__section-title">Synopsis</h2>
                <div className="single-anime-page__synopsis-box">
                  <p>{formatSynopsisForDisplay(anime.synopsis)}</p>
                </div>
              </section>
            ) : null}

            {trailerId ? (
              <section className="single-anime-page__section">
                <h2 className="single-anime-page__section-title">Trailer</h2>
                <div className="single-anime-page__trailer-frame">
                  <iframe
                    src={`https://www.youtube.com/embed/${trailerId}`}
                    title={`Bande-annonce — ${title}`}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              </section>
            ) : null}

            {watchLinks.length > 0 ? (
              <section className="single-anime-page__section">
                <h2 className="single-anime-page__section-title">Des liens utiles</h2>
                <div className="single-anime-page__watch">
                  {watchLinks.map((link) => (
                    <a
                      key={link.url}
                      className="single-anime-page__watch-link"
                      href={link.url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {link.site ?? 'Streaming'}
                    </a>
                  ))}
                </div>
              </section>
            ) : null}

            {anime.characters.length > 0 ? (
              <section className="single-anime-page__section">
                <h2 className="single-anime-page__section-title">Personnages</h2>
                <div className="single-anime-page__characters-panel">
                <ul className="single-anime-page__characters">
                  {anime.characters.slice(0, 8).map((character, index) => (
                    <li key={`${character.name ?? 'character'}-${index}`}>
                      <div className="single-anime-page__character">
                        <div className="single-anime-page__character-media">
                          {character.image ? (
                            <img
                              src={character.image}
                              alt={character.name ?? ''}
                              loading="lazy"
                            />
                          ) : null}
                        </div>
                        <span className="single-anime-page__character-name">
                          {character.name ?? 'Inconnu'}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
                </div>
              </section>
            ) : null}

            {anime.genres.length > 0 ? (
              <CatalogThemeSection
                variant="similar"
                anilistId={anime.anilist_id}
                genres={anime.genres}
                embedded
              />
            ) : null}
          </>
        ) : null}
      </div>
    </main>
  )
}
