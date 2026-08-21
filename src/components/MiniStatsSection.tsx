import { Link } from 'react-router-dom'
import { useStats } from '../hooks/useStats'
import { InfoTooltip } from './InfoTooltip'
import { StreakDisplay } from './StreakDisplay'

export function MiniStatsSection() {
  const { user, stats, loading } = useStats()

  const cardsDrawn = stats?.activity.cardsDrawn ?? 0
  const animesRecommended = stats?.activity.animesRecommended ?? 0
  const drawsCompleted = stats?.activity.drawsCompleted ?? 0
  const recoInLists =
    (stats?.performance.planned ?? 0) +
    (stats?.performance.watching ?? 0) +
    (stats?.performance.paused ?? 0) +
    (stats?.performance.completed ?? 0)
  const uniqueDays = stats?.streak.uniqueDays ?? 0
  const selfRank = stats?.friends.selfRank
  const friendsTotal = stats?.friends.total ?? 0

  return (
    <section className="ministats grid">
      <h2>Mini&nbsp;stats</h2>

      {!user ? (
        <p className="ministats__guest">
          <Link to="/profil">Connecte-toi</Link> pour voir tes stats.
        </p>
      ) : loading ? (
        <p className="ministats__guest">Chargement…</p>
      ) : (
        <>
          <div className="ministats__board">
            <div className="ministats__element">
              <span className="ministats__number">{cardsDrawn}</span>
              <h4>Cartes&nbsp;tirés</h4>
            </div>
            <div className="ministats__element">
              <span className="ministats__number">{animesRecommended}</span>
              <h4>Animes&nbsp;recommandés</h4>
            </div>
            <div className="ministats__element">
              <span className="ministats__number">{drawsCompleted}</span>
              <h4>Tirages&nbsp;fait</h4>
            </div>
            <div className="ministats__element">
              <span className="ministats__number">{recoInLists}</span>
              <h4>Animes reco ajoutés dans tes&nbsp;listes</h4>
            </div>
            <div className="ministats__element column">
              <h4>Tu&nbsp;es</h4>
              <span className="ministats__number">
                {selfRank && friendsTotal > 1 ? (
                  <>
                    {selfRank}
                    <sup>{selfRank === 1 ? 'er' : 'e'}</sup>
                    {' / '}
                    {friendsTotal}
                  </>
                ) : (
                  '—'
                )}
              </span>
              <h4 className="ministats__element-subtitle">Parmi ta liste&nbsp;d&apos;amis</h4>
            </div>
            <div className="stats-card stats-streak ministats__streak">
              <InfoTooltip text="Un jour compte dès le premier tirage. Les tirages suivants le même jour n’ajoutent rien." />
              <div className="ministats__streak-main">
                <StreakDisplay value={uniqueDays} />
                <h4 className="stats-streak__label">Tirages&nbsp;unique</h4>
              </div>
            </div>
          </div>
        </>
      )}

      <Link to="/stats" className="seemore">
        Voir les statistiques&nbsp;complètes
      </Link>
    </section>
  )
}
