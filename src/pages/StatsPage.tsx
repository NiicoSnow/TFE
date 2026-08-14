import { useMemo, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { InfoTooltip } from '../components/InfoTooltip'
import { StreakDisplay } from '../components/StreakDisplay'
import { useStats } from '../hooks/useStats'
import { ANIME_LIST_LABELS } from '../lib/animeLibrary'
import { publicAsset } from '../lib/publicPath'
import type { StatsChartCategory } from '../types/stats'

function rankLabel(rank: number): string {
  if (rank === 1) return 'premier'
  if (rank === 2) return 'deuxième'
  if (rank === 3) return 'troisième'
  return `${rank}e`
}

function StatsChartBlock({ charts }: { charts: StatsChartCategory[] }) {
  const [index, setIndex] = useState(0)
  const chart = charts[index] ?? charts[0]

  if (!chart) {
    return (
      <div className="stats-card">
        <p className="stats-card__empty">Fais un tirage pour voir le graphique de tes choix.</p>
      </div>
    )
  }

  const cycle = () => {
    setIndex((i) => (i + 1) % charts.length)
  }

  const colCount = Math.max(chart.bars.length, 1)

  return (
    <div className="stats-card stats-chart">
      <button type="button" className="stats-chart__switch" onClick={cycle} aria-label="Changer de thème">
        <span className="stats-chart__switch-title">
          {chart.label}
          <img src={publicAsset('assets/switch2.svg')} alt="" width={22} height={18} />
        </span>
        <span className="stats-chart__switch-sub">que tu as choisi</span>
      </button>
      <p className="stats-chart__axis-label">En pourcentage</p>
      <div className="stats-chart__plot" role="img" aria-label={`Répartition ${chart.label}`}>
        <div className="stats-chart__y" aria-hidden>
          {[100, 75, 50, 25, 0].map((tick) => (
            <div key={tick} className="stats-chart__y-tick">
              <span>{tick}</span>
              <i />
            </div>
          ))}
        </div>
        <div
          className="stats-chart__bars"
          style={{ gridTemplateColumns: `repeat(${colCount}, minmax(0, 1fr))` }}
        >
          {chart.bars.map((bar) => (
            <div key={bar.choiceId} className="stats-chart__col">
              <div className="stats-chart__track">
                <span
                  className="stats-chart__value"
                  style={{ bottom: `calc(${Math.max(bar.percent, 2)}% + 0.4rem)` }}
                >
                  {bar.percent}%
                </span>
                <div
                  className={
                    bar.percent === 0
                      ? 'stats-chart__bar stats-chart__bar--empty'
                      : 'stats-chart__bar'
                  }
                  style={{ height: `${Math.max(bar.percent, 2)}%` }}
                />
              </div>
              <span className="stats-chart__label">{bar.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function StatsPage() {
  const { user, authLoading, stats, loading, error } = useStats()

  const friendsHeadline = useMemo(() => {
    if (!stats?.friends.selfRank || stats.friends.total <= 1) {
      return null
    }
    const label = rankLabel(stats.friends.selfRank)
    return (
      <>
        Tu es <span className="stats-friends__highlight">{label}</span> parmi tes amis !
      </>
    )
  }, [stats])

  if (!authLoading && !user) {
    return <Navigate to="/profil" replace />
  }

  return (
    <section className="stats-page grid">

      {loading ? <p className="stats-page__status">Chargement…</p> : null}
      {error ? <p className="stats-page__status stats-page__status--error">{error}</p> : null}

      {!loading && !error && stats ? (
        <div className="stats-page__content">
          {/* Streak */}
          <section className="stats-block">
            <h2 className="stats-block__title">Streak</h2>
            <div className="stats-card stats-streak">
              <InfoTooltip
                className="stats-streak__info"
                text="Un jour compte dès le premier tirage. Les tirages suivants le même jour n’ajoutent rien."
              />
              <StreakDisplay value={stats.streak.uniqueDays} />
              <h4 className="stats-streak__label">Tirages unique</h4>
              <p className="stats-streak__week">
                Dont <strong>{stats.streak.uniqueDaysThisWeek}</strong> cette semaine !
              </p>
            </div>
          </section>

          {/* Graphique */}
          <section className="stats-block">
            <h2 className="stats-block__title">Graphique</h2>
            <StatsChartBlock charts={stats.chartsByCategory} />
          </section>

          {/* Activité */}
          <section className="stats-block">
            <h2 className="stats-block__title">Activité</h2>
            <div className="stats-card stats-activity">
              <div className="stats-activity__row">
                <span className="stats-activity__num">{stats.activity.cardsDrawn}</span>
                <h4 className="stats-activity__label">Cartes tirés</h4>
              </div>
              <div className="stats-activity__row">
                <span className="stats-activity__num">{stats.activity.animesRecommended}</span>
                <h4 className="stats-activity__label">Animes recommandés</h4>
              </div>
              <div className="stats-activity__row">
                <span className="stats-activity__num">{stats.activity.drawsCompleted}</span>
                <h4 className="stats-activity__label">Tirages fait</h4>
              </div>
            </div>
          </section>

          {/* Préférences */}
          <section className="stats-block">
            <h2 className="stats-block__title">Préférence</h2>
            <div className="stats-card stats-prefs">
              <p className="stats-prefs__intro">
                Les 3 cartes que tu as choisi le plus parmi tous les thèmes sont
              </p>
              {stats.topChoices.length === 0 ? (
                <p className="stats-card__empty">Pas encore assez de choix pour un top 3.</p>
              ) : (
                <ul className="stats-prefs__list">
                  {stats.topChoices.map((choice) => (
                    <li key={choice.choiceId} className="stats-prefs__item">
                      {choice.image ? (
                        <img
                          className="stats-prefs__img"
                          src={choice.image}
                          alt=""
                          width={120}
                          height={168}
                          loading="lazy"
                        />
                      ) : (
                        <div className="stats-prefs__img stats-prefs__img--placeholder" />
                      )}
                      <div className="stats-prefs__meta">
                        <h4 className="stats-prefs__name">{choice.label}</h4>
                        <h5 className="stats-prefs__cat">({choice.categoryLabel})</h5>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>

          {/* Amis */}
          <section className="stats-block">
            <h2 className="stats-block__title">Amis</h2>
            <div className="stats-card stats-friends">
              {stats.friends.total <= 1 ? (
                <p className="stats-card__empty">
                  Ajoute des amis pour voir le classement.{' '}
                  <Link to="/amis">Aller aux amis</Link>
                </p>
              ) : (
                <>
                  {friendsHeadline ? <p className="stats-friends__headline">{friendsHeadline}</p> : null}
                  <ol className="stats-friends__list">
                    {stats.friends.ranks.map((row) => (
                      <li
                        key={row.userId}
                        className={
                          row.isSelf
                            ? 'stats-friends__row stats-friends__row--self'
                            : 'stats-friends__row'
                        }
                      >
                        {row.rank === 1 ? (
                          <img
                            src={publicAsset('assets/crown.svg')}
                            alt=""
                            className="stats-friends__crown"
                            width={29}
                            height={20}
                          />
                        ) : (
                          <span className="stats-friends__rank">{row.rank}.</span>
                        )}
                        <span className="stats-friends__name">
                          {row.displayName}
                          {row.isSelf ? ' (toi)' : ''}
                        </span>
                      </li>
                    ))}
                  </ol>
                  <p className="stats-friends__footnote">Le classement se base sur le streak</p>
                </>
              )}
            </div>
          </section>

          {/* Performance */}
          <section className="stats-block">
            <h2 className="stats-block__title">Performance des recommandations</h2>
            <div className="stats-card stats-perf">
              <p className="stats-perf__intro">
                Après tous tes tests passés, on t'a recommandé{' '}
                <strong>{stats.performance.totalRecommended} animés </strong>! Voyons ensemble ce que
                tu en as fait.
              </p>

              {(
                [
                  ['planned', stats.performance.planned],
                  ['watching', stats.performance.watching],
                  ['paused', stats.performance.paused],
                  ['completed', stats.performance.completed],
                ] as const
              ).map(([status, count]) => (
                <div key={status} className="stats-perf__row">
                  <p className="stats-perf__num">{count}</p>
                  <p className="stats-perf__text">Ont été ajouté dans ta liste</p>
                  <p className="stats-perf__status">{ANIME_LIST_LABELS[status]}</p>
                </div>
              ))}

              <div className="stats-perf__row">
                <p className="stats-perf__num">{stats.performance.ignored}</p>
                <p className="stats-perf__text">Ont été ignoré</p>
              </div>
            </div>
          </section>
        </div>
      ) : null}
    </section>
  )
}
