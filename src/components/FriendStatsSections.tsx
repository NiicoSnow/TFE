import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { StreakDisplay } from './StreakDisplay'
import { useFriendPageStats } from '../hooks/useFriendPageStats'
import { publicAsset } from '../lib/publicPath'
import type { UserQuizStats } from '../types/stats'

function rankLabel(rank: number): string {
  if (rank === 1) return 'premier'
  if (rank === 2) return 'deuxième'
  if (rank === 3) return 'troisième'
  return `${rank}e`
}

type VersusPanelProps = {
  name: string
  stats: UserQuizStats
  variant: 'self' | 'friend'
}

function VersusPanel({ name, stats, variant }: VersusPanelProps) {
  const activity = (
    <div className="versus__activity">
      <div className="versus__number-container">
        <span className="versus__number">{stats.activity.cardsDrawn}</span>
        <h4>Cartes&nbsp;tirés</h4>
      </div>
      <div className="versus__number-container">
        <span className="versus__number">{stats.activity.drawsCompleted}</span>
        <h4>Tirages&nbsp;fait</h4>
      </div>
    </div>
  )

  const streak = (
    <div className="versus__number-container column streak">
      <StreakDisplay value={stats.streak.uniqueDays} />
      <h4>Tirages&nbsp;unique</h4>
    </div>
  )

  return (
    <div className={`versus__element versus__element--${variant}`}>
      <h3 className="versus__name">{name}</h3>
      <span className="versus__line" />
      <div className="versus__body">
        {variant === 'self' ? (
          <>
            {activity}
            {streak}
          </>
        ) : (
          <>
            {streak}
            {activity}
          </>
        )}
      </div>
    </div>
  )
}

type FriendStatsSectionsProps = {
  viewerId: string
  friendUserId: string
  friendName: string
}

export function FriendStatsSections({
  viewerId,
  friendUserId,
  friendName,
}: FriendStatsSectionsProps) {
  const { viewerStats, friendStats, loading, error } = useFriendPageStats(viewerId, friendUserId)

  const friendRank = useMemo(
    () => viewerStats?.friends.ranks.find((row) => row.userId === friendUserId) ?? null,
    [viewerStats, friendUserId],
  )

  const friendsHeadline = useMemo(() => {
    if (!friendRank || !viewerStats || viewerStats.friends.total <= 1) return null
    const label = rankLabel(friendRank.rank)
    return (
      <>
        {friendName} est <span className="stats-friends__highlight">{label}</span> parmi tes amis&nbsp;!
      </>
    )
  }, [friendName, friendRank, viewerStats])

  if (loading) {
    return (
      <div className="single-friend-page__stats">
        <p className="single-friend-page__status">Chargement des stats…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="single-friend-page__stats">
        <p className="single-friend-page__status single-friend-page__status--error">{error}</p>
      </div>
    )
  }

  if (!viewerStats || !friendStats) return null

  const friendsListCols = viewerStats.friends.ranks.length >= 10

  return (
    <div className="single-friend-page__stats">
      <section className="single-friend-stats__versus versus">
        <h2 className="stats-block__title">Comparaison avec un&nbsp;ami</h2>
        <div className="versus__board">
          <VersusPanel name="Moi" stats={viewerStats} variant="self" />
          <h3 className="versus__vs">VS</h3>
          <VersusPanel name={friendName} stats={friendStats} variant="friend" />
        </div>
      </section>

      <div className="single-friend-stats__row">
      <section className="stats-block stats-block--prefs">
        <h2 className="stats-block__title">Préférence</h2>
        <div className="stats-card stats-prefs">
          <p className="stats-prefs__intro">
            Les 3 cartes que {friendName} a choisi le plus parmi tous les thèmes&nbsp;sont
          </p>
          {friendStats.topChoices.length === 0 ? (
            <p className="stats-card__empty">Pas encore assez de choix pour un top 3.</p>
          ) : (
            <ul className="stats-prefs__list">
              {friendStats.topChoices.map((choice) => (
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

      <section className="stats-block stats-block--friends">
        <h2 className="stats-block__title">Amis</h2>
        <div className="stats-card stats-friends">
          {viewerStats.friends.total <= 1 ? (
            <p className="stats-card__empty">
              Ajoute des amis pour voir le classement. <Link to="/amis">Aller aux amis</Link>
            </p>
          ) : (
            <>
              {friendsHeadline ? <p className="stats-friends__headline">{friendsHeadline}</p> : null}
              <ol
                className={
                  friendsListCols
                    ? 'stats-friends__list stats-friends__list--cols'
                    : 'stats-friends__list'
                }
                style={
                  friendsListCols
                    ? {
                        ['--friends-rows' as string]: Math.ceil(viewerStats.friends.ranks.length / 2),
                      }
                    : undefined
                }
              >
                {viewerStats.friends.ranks.map((row) => {
                  const isHighlight = row.userId === friendUserId
                  return (
                    <li
                      key={row.userId}
                      className={
                        isHighlight
                          ? 'stats-friends__row stats-friends__row--highlight'
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
                  )
                })}
              </ol>
              <p className="stats-friends__footnote">Le classement se base sur le&nbsp;streak</p>
            </>
          )}
        </div>
      </section>
      </div>
    </div>
  )
}
