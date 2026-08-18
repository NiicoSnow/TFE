import { supabase } from './supabase'
import {
  getQuizCategoryLabel,
  getQuizChoiceMeta,
  getQuizChoicesForCategory,
  QUIZ_CATEGORY_ORDER,
  quizChoiceImageSrc,
} from './quizMeta'
import { displayProfileName } from './profileDisplay'
import type { AnimeListStatus } from '../types/animeLibrary'
import type { QuizAnswers, QuizQuestion, ScoredAnime } from '../types/quiz'
import type {
  StatsChartCategory,
  StatsFriendRank,
  StatsTopChoice,
  UserQuizStats,
} from '../types/stats'

export type SaveQuizSessionInput = {
  userId: string
  askedQuestions: QuizQuestion[]
  answers: QuizAnswers
  results: ScoredAnime[]
}

export async function saveCompletedQuizSession({
  userId,
  askedQuestions,
  answers,
  results,
}: SaveQuizSessionInput): Promise<string> {
  const { data: session, error: sessionError } = await supabase
    .from('quiz_sessions')
    .insert({ user_id: userId })
    .select('id')
    .single()

  if (sessionError) throw sessionError
  if (!session?.id) throw new Error('Session quiz non créée.')

  const sessionId = session.id as string

  const choiceRows = askedQuestions.flatMap((question) => {
    const choiceId = answers[question.id]
    if (!choiceId) return []
    return [
      {
        session_id: sessionId,
        user_id: userId,
        question_id: question.id,
        category: question.category,
        choice_id: choiceId,
      },
    ]
  })

  if (choiceRows.length > 0) {
    const { error: choicesError } = await supabase
      .from('quiz_session_choices')
      .insert(choiceRows)
    if (choicesError) throw choicesError
  }

  const recommendationRows = results.map((anime, index) => ({
    session_id: sessionId,
    user_id: userId,
    anilist_id: anime.anilistId,
    rank: index + 1,
    score: anime.score,
  }))

  if (recommendationRows.length > 0) {
    const { error: recommendationsError } = await supabase
      .from('quiz_session_recommendations')
      .insert(recommendationRows)
    if (recommendationsError) throw recommendationsError
  }

  return sessionId
}

function startOfWeekMonday(date = new Date()): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() + diff)
  return d
}

function toLocalDayKey(iso: string): string {
  const d = new Date(iso)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function buildCharts(
  choiceRows: { category: string; choice_id: string }[],
): StatsChartCategory[] {
  const countsByCategory = new Map<string, Map<string, number>>()

  for (const row of choiceRows) {
    let byChoice = countsByCategory.get(row.category)
    if (!byChoice) {
      byChoice = new Map()
      countsByCategory.set(row.category, byChoice)
    }
    byChoice.set(row.choice_id, (byChoice.get(row.choice_id) ?? 0) + 1)
  }

  return QUIZ_CATEGORY_ORDER.map((category) => {
    const counts = countsByCategory.get(category) ?? new Map()
    const choices = getQuizChoicesForCategory(category)
    const total = [...counts.values()].reduce((sum, n) => sum + n, 0)

    const bars = choices.map((choice) => {
      const count = counts.get(choice.id) ?? 0
      const percent = total > 0 ? Math.round((count / total) * 100) : 0
      return {
        choiceId: choice.id,
        label: choice.label,
        count,
        percent,
      }
    })

    return {
      category,
      label: getQuizCategoryLabel(category),
      bars,
      total,
    }
  })
}

function buildTopChoices(
  choiceRows: { category: string; choice_id: string }[],
  limit = 3,
): StatsTopChoice[] {
  const counts = new Map<string, { count: number; category: string }>()

  for (const row of choiceRows) {
    const prev = counts.get(row.choice_id)
    counts.set(row.choice_id, {
      count: (prev?.count ?? 0) + 1,
      category: row.category,
    })
  }

  return [...counts.entries()]
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, limit)
    .map(([choiceId, info]) => {
      const meta = getQuizChoiceMeta(choiceId)
      return {
        choiceId,
        label: meta?.label ?? choiceId,
        category: info.category,
        categoryLabel: getQuizCategoryLabel(info.category),
        image: meta ? quizChoiceImageSrc(meta.image) : '',
        count: info.count,
      }
    })
}

export async function fetchUserQuizStats(userId: string): Promise<UserQuizStats> {
  const weekStart = startOfWeekMonday()

  const [
    profileRes,
    sessionsRes,
    choicesRes,
    recommendationsRes,
    friendshipsRes,
  ] = await Promise.all([
    supabase
      .from('profiles')
      .select('quiz_unique_days, quiz_streak_current, quiz_streak_best')
      .eq('id', userId)
      .maybeSingle(),
    supabase
      .from('quiz_sessions')
      .select('id, completed_at')
      .eq('user_id', userId),
    supabase
      .from('quiz_session_choices')
      .select('category, choice_id')
      .eq('user_id', userId),
    supabase
      .from('quiz_session_recommendations')
      .select('anilist_id')
      .eq('user_id', userId),
    supabase
      .from('friendships')
      .select('requester_id, addressee_id')
      .eq('status', 'accepted')
      .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`),
  ])

  if (profileRes.error) throw profileRes.error
  if (sessionsRes.error) throw sessionsRes.error
  if (choicesRes.error) throw choicesRes.error
  if (recommendationsRes.error) throw recommendationsRes.error
  if (friendshipsRes.error) throw friendshipsRes.error

  const sessions = sessionsRes.data ?? []
  const choices = choicesRes.data ?? []
  const recommendations = recommendationsRes.data ?? []

  const uniqueDaysThisWeek = new Set(
    sessions
      .filter((s) => new Date(s.completed_at) >= weekStart)
      .map((s) => toLocalDayKey(s.completed_at)),
  ).size

  const anilistIds = recommendations.map((r) => r.anilist_id as number)
  let libraryByAnilist = new Map<number, AnimeListStatus>()

  if (anilistIds.length > 0) {
    const uniqueIds = [...new Set(anilistIds)]
    const { data: libraryRows, error: libraryError } = await supabase
      .from('user_anime_library')
      .select('anilist_id, status')
      .eq('user_id', userId)
      .in('anilist_id', uniqueIds)

    if (libraryError) throw libraryError

    libraryByAnilist = new Map(
      (libraryRows ?? []).map((row) => [row.anilist_id as number, row.status as AnimeListStatus]),
    )
  }

  const performance = {
    totalRecommended: recommendations.length,
    planned: 0,
    watching: 0,
    paused: 0,
    completed: 0,
    ignored: 0,
  }

  for (const row of recommendations) {
    const status = libraryByAnilist.get(row.anilist_id as number)
    if (!status) {
      performance.ignored += 1
    } else {
      performance[status] += 1
    }
  }

  const friendIds = (friendshipsRes.data ?? []).map((row) =>
    row.requester_id === userId ? row.addressee_id : row.requester_id,
  )
  const boardIds = [...new Set([userId, ...friendIds])]

  const { data: boardProfiles, error: boardError } = await supabase
    .from('profiles')
    .select('id, username, display_name, quiz_unique_days')
    .in('id', boardIds)

  if (boardError) throw boardError

  const ranks: StatsFriendRank[] = (boardProfiles ?? [])
    .map((p) => ({
      userId: p.id as string,
      username: (p.username as string | null) ?? '',
      displayName: displayProfileName({
        username: p.username,
        display_name: p.display_name,
      }),
      uniqueDays: (p.quiz_unique_days as number | null) ?? 0,
      rank: 0,
      isSelf: p.id === userId,
    }))
    .sort((a, b) => {
      if (b.uniqueDays !== a.uniqueDays) return b.uniqueDays - a.uniqueDays
      return a.displayName.localeCompare(b.displayName, 'fr')
    })
    .map((row, index) => ({ ...row, rank: index + 1 }))

  const selfRank = ranks.find((r) => r.isSelf)?.rank ?? null

  return {
    streak: {
      uniqueDays: profileRes.data?.quiz_unique_days ?? 0,
      uniqueDaysThisWeek,
      streakCurrent: profileRes.data?.quiz_streak_current ?? 0,
      streakBest: profileRes.data?.quiz_streak_best ?? 0,
    },
    activity: {
      cardsDrawn: choices.length,
      animesRecommended: recommendations.length,
      drawsCompleted: sessions.length,
    },
    chartsByCategory: buildCharts(choices),
    topChoices: buildTopChoices(choices),
    friends: {
      ranks,
      selfRank,
      total: ranks.length,
    },
    performance,
  }
}
