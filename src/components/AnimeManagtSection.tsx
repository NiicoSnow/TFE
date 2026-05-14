import { Fragment, useEffect, useState } from 'react'

const CATEGORIES = [
  "C'est prévu",
  'En train de regarder',
  'En pause',
  'Fini',
] as const

type AnimePreview = {
  id: string
  title: string
  rating: string
  poster: string
}

const MOCK_BY_CATEGORY: AnimePreview[][] = [
  [
    {
      id: 'p1',
      title: 'Darling In The FranXX',
      rating: '6.9',
      poster: 'https://placehold.co/72x102/1e293b/ec4899?text=Poster',
    },
    {
      id: 'p2',
      title: 'Steins;Gate',
      rating: '9.0',
      poster: 'https://placehold.co/72x102/1e293b/ec4899?text=Poster',
    },
  ],
  [
    {
      id: 'w1',
      title: 'Attack on Titan',
      rating: '8.5',
      poster: 'https://placehold.co/72x102/1e293b/ec4899?text=Poster',
    },
  ],
  [
    {
      id: 's1',
      title: 'One Piece',
      rating: '9.1',
      poster: 'https://placehold.co/72x102/1e293b/ec4899?text=Poster',
    },
    {
      id: 's2',
      title: 'Bleach',
      rating: '8.2',
      poster: 'https://placehold.co/72x102/1e293b/ec4899?text=Poster',
    },
  ],
  [
    {
      id: 'd1',
      title: 'Death Note',
      rating: '8.6',
      poster: 'https://placehold.co/72x102/1e293b/ec4899?text=Poster',
    },
    {
      id: 'd2',
      title: 'Fullmetal Alchemist: Brotherhood',
      rating: '9.1',
      poster: 'https://placehold.co/72x102/1e293b/ec4899?text=Poster',
    },
    {
      id: 'd3',
      title: 'Mob Psycho 100',
      rating: '8.5',
      poster: 'https://placehold.co/72x102/1e293b/ec4899?text=Poster',
    },
  ],
]

function cloneLists(source: AnimePreview[][]) {
  return source.map((arr) => arr.map((a) => ({ ...a })))
}

type MoveContext = { fromIndex: number; anime: AnimePreview }

function ArrowLeft({ className }: { className?: string }) {
  return <svg className={className} width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M15 18l-6-6 6-6" /></svg>
}

function ArrowRight({ className }: { className?: string }) {
  return <svg className={className} width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M9 18l6-6-6-6" /></svg>
}

export function AnimeManagtSection() {
  const [lists, setLists] = useState(() => cloneLists(MOCK_BY_CATEGORY))
  const [categoryIndex, setCategoryIndex] = useState(0)
  const [moveTarget, setMoveTarget] = useState<MoveContext | null>(null)

  const n = CATEGORIES.length
  const currentLabel = CATEGORIES[categoryIndex]
  const items = lists[categoryIndex] ?? []

  useEffect(() => {
    if (!moveTarget) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMoveTarget(null)
    }
    window.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [moveTarget])

  const goPrev = () => {
    setCategoryIndex((i) => (i - 1 + n) % n)
  }

  const goNext = () => {
    setCategoryIndex((i) => (i + 1) % n)
  }

  const openMovePicker = (anime: AnimePreview) => {
    setMoveTarget({ fromIndex: categoryIndex, anime })
  }

  const confirmMoveTo = (toIndex: number) => {
    if (!moveTarget || toIndex === moveTarget.fromIndex) {
      setMoveTarget(null)
      return
    }
    const { fromIndex, anime } = moveTarget
    setLists((prev) => {
      const next = prev.map((arr) => [...arr])
      next[fromIndex] = next[fromIndex].filter((a) => a.id !== anime.id)
      next[toIndex] = [...next[toIndex], anime]
      return next
    })
    setMoveTarget(null)
  }

  return (
    <section className="anime-management grid">
      <div className="anime-management__heading">
        <h2>Gestion des animes</h2>
      </div>
      <div className="anime-management__element">
        <div className="anime-management__nav anime-management__nav--mobile">
          <button type="button" className="anime-management__arrow" onClick={goPrev} aria-label="Catégorie précédente"><ArrowLeft /></button>
          <p className="anime-management__category-title" aria-live="polite">{currentLabel}</p>
          <button type="button" className="anime-management__arrow" onClick={goNext} aria-label="Catégorie suivante"><ArrowRight /></button>
        </div>

        <nav className="anime-management__nav anime-management__nav--desktop" aria-label="Catégories de listes">
          {CATEGORIES.map((label, i) => (
            <Fragment key={label}>
              {i > 0 ? <span className="anime-management__tab-sep" aria-hidden>|</span> : null}
              <button type="button" className={i === categoryIndex ? 'anime-management__tab anime-management__tab--active' : 'anime-management__tab'} onClick={() => setCategoryIndex(i)}>{label}</button>
            </Fragment>
          ))}
        </nav>
        <div className="anime-management__divider" aria-hidden />
        <ul className="anime-management__list">
          {items.map((anime) => (
            <li key={anime.id} className="anime-management__card">
              <img className="anime-management__poster" src={anime.poster} alt="" />
              <div className="anime-management__info">
                <h3 className="anime-management__anime-title">{anime.title}</h3>
                <p className="anime-management__rating">
                  <span className="anime-management__rating-value">{anime.rating}</span>
                  <span className="anime-management__rating-max">/10</span>
                </p>
                <button type="button" className="anime-management__changer" onClick={() => openMovePicker(anime)}>Changer</button>
              </div>
              <button type="button" className="anime-management__move-btn" onClick={() => openMovePicker(anime)} aria-label={`Changer de liste pour ${anime.title}`}>
                <img className="anime-management__icon-slot" src="/switch.svg" alt="" width={30} height={30} />
              </button>
            </li>
          ))}
        </ul>
      </div>

      {moveTarget ? (
        <div className="anime-management__modal-root">
          <button type="button" className="anime-management__modal-backdrop" aria-label="Fermer" onClick={() => setMoveTarget(null)} />
          <div className="anime-management__modal" role="dialog" aria-modal="true" aria-labelledby="anime-move-dialog-title">
            <h3 id="anime-move-dialog-title" className="anime-management__modal-title">Déplacer vers une liste</h3>
            <p className="anime-management__modal-anime">{moveTarget.anime.title}</p>
            <ul className="anime-management__modal-list">
              {CATEGORIES.map((label, i) => (
                <li key={label}>
                  <button type="button" className="anime-management__modal-option" disabled={i === moveTarget.fromIndex} onClick={() => confirmMoveTo(i)}>
                    {label}
                    {i === moveTarget.fromIndex ? <span className="anime-management__modal-current"> (actuelle)</span> : null}
                  </button>
                </li>
              ))}
            </ul>
            <button type="button" className="anime-management__modal-cancel" onClick={() => setMoveTarget(null)}>Annuler</button>
          </div>
        </div>
      ) : null}
    </section>
  )
}
