import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useStats } from '../hooks/useStats'
import { getFriends } from '../lib/friends'
import { displayProfileName } from '../lib/profileDisplay'
import { publicAsset } from '../lib/publicPath'
import { fetchUserQuizStats } from '../lib/quizStats'
import type { FriendListItem } from '../types/friendship'
import type { UserQuizStats } from '../types/stats'
import { StreakDisplay } from './StreakDisplay'

type VersusPanelProps = {
  name: string
  cardsDrawn: number
  drawsCompleted: number
  uniqueDays: number
  variant: 'self' | 'friend'
  onSwitchFriend?: () => void
  canSwitchFriend?: boolean
  loading?: boolean
}

function VersusPanel({
  name,
  cardsDrawn,
  drawsCompleted,
  uniqueDays,
  variant,
  onSwitchFriend,
  canSwitchFriend = false,
  loading = false,
}: VersusPanelProps) {
  const activity = (
    <div className="versus__activity">
      <div className="versus__number-container">
        <span className="versus__number">{cardsDrawn}</span>
        <h4>Cartes tirés</h4>
      </div>
      <div className="versus__number-container">
        <span className="versus__number">{drawsCompleted}</span>
        <h4>Tirages fait</h4>
      </div>
    </div>
  )

  const streak = (
    <div className="versus__number-container column streak">
      <StreakDisplay value={uniqueDays} />
      <h4>Tirages unique</h4>
    </div>
  )

  return (
    <div className={`versus__element versus__element--${variant}`}>
      {variant === 'friend' && onSwitchFriend && canSwitchFriend ? (
        <button
          type="button"
          className="versus__name versus__name--switch"
          onClick={onSwitchFriend}
          aria-label="Changer d’ami"
          disabled={loading}
        >
          <span>{name}</span>
          <img src={publicAsset('assets/switch2.svg')} alt="" width={22} height={18} />
        </button>
      ) : (
        <h3 className="versus__name">{name}</h3>
      )}
      <span className="versus__line" />
      {loading ? (
        <div className="versus__body versus__body--loading">
          <p className="versus__panel-status">Chargement…</p>
        </div>
      ) : (
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
      )}
    </div>
  )
}

export function VersusSection() {
  const { user, stats: viewerStats, loading: viewerLoading } = useStats()
  const [friends, setFriends] = useState<FriendListItem[]>([])
  const [friendsLoading, setFriendsLoading] = useState(false)
  const [friendIndex, setFriendIndex] = useState(0)
  const [friendStats, setFriendStats] = useState<UserQuizStats | null>(null)
  const [friendStatsLoading, setFriendStatsLoading] = useState(false)
  const [boardReady, setBoardReady] = useState(false)
  const statsCacheRef = useRef<Record<string, UserQuizStats>>({})

  useEffect(() => {
    if (!user?.id) {
      setFriends([])
      setFriendIndex(0)
      setBoardReady(false)
      return
    }

    const userId = user.id
    let cancelled = false

    async function loadFriends() {
      setFriendsLoading(true)
      try {
        const list = await getFriends(userId)
        if (!cancelled) {
          setFriends(list)
          setFriendIndex(0)
        }
      } catch {
        if (!cancelled) setFriends([])
      } finally {
        if (!cancelled) setFriendsLoading(false)
      }
    }

    void loadFriends()
    return () => {
      cancelled = true
    }
  }, [user?.id])

  const activeFriend = friends[friendIndex] ?? null
  const activeFriendId = activeFriend?.profile.id

  useEffect(() => {
    if (!activeFriendId) {
      setFriendStats(null)
      setFriendStatsLoading(false)
      return
    }

    const cached = statsCacheRef.current[activeFriendId]
    if (cached) {
      setFriendStats(cached)
      setFriendStatsLoading(false)
      setBoardReady(true)
      return
    }

    setFriendStats(null)
    let cancelled = false

    async function loadFriendStats() {
      setFriendStatsLoading(true)
      try {
        const data = await fetchUserQuizStats(activeFriendId)
        if (!cancelled) {
          statsCacheRef.current[activeFriendId] = data
          setFriendStats(data)
          setBoardReady(true)
        }
      } catch {
        if (!cancelled) setFriendStats(null)
      } finally {
        if (!cancelled) setFriendStatsLoading(false)
      }
    }

    void loadFriendStats()
    return () => {
      cancelled = true
    }
  }, [activeFriendId])

  const cycleFriend = () => {
    if (friends.length <= 1 || friendStatsLoading) return
    setFriendIndex((i) => (i + 1) % friends.length)
  }

  const friendName = activeFriend ? displayProfileName(activeFriend.profile) : 'Ami'
  const initialLoading = viewerLoading || friendsLoading || (!boardReady && friendStatsLoading)
  const friendPanelLoading = boardReady && friendStatsLoading && !friendStats

  return (
    <section className="versus grid">
      <h2>Comparaison avec un ami</h2>

      {!user ? (
        <p className="versus__status">
          <Link to="/profil">Connecte-toi</Link> pour comparer tes stats avec un ami.
        </p>
      ) : initialLoading ? (
        <p className="versus__status">Chargement…</p>
      ) : friends.length === 0 || !viewerStats ? (
        <p className="versus__status">
          Ajoute des amis pour comparer vos stats. <Link to="/amis">Aller aux amis</Link>
        </p>
      ) : (
        <div className="versus__board">
          <VersusPanel
            name="Moi"
            cardsDrawn={viewerStats.activity.cardsDrawn}
            drawsCompleted={viewerStats.activity.drawsCompleted}
            uniqueDays={viewerStats.streak.uniqueDays}
            variant="self"
          />
          <h3 className="versus__vs">VS</h3>
          <VersusPanel
            name={friendName}
            cardsDrawn={friendStats?.activity.cardsDrawn ?? 0}
            drawsCompleted={friendStats?.activity.drawsCompleted ?? 0}
            uniqueDays={friendStats?.streak.uniqueDays ?? 0}
            variant="friend"
            onSwitchFriend={cycleFriend}
            canSwitchFriend={friends.length > 1}
            loading={friendPanelLoading}
          />
        </div>
      )}

      <Link to="/amis" className="seemore">
        Voir sa liste d&apos;amis
      </Link>
    </section>
  )
}
