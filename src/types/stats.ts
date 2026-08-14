export type StatsActivity = {
  cardsDrawn: number
  animesRecommended: number
  drawsCompleted: number
}

export type StatsStreak = {
  uniqueDays: number
  uniqueDaysThisWeek: number
  streakCurrent: number
  streakBest: number
}

export type StatsChartBar = {
  choiceId: string
  label: string
  percent: number
  count: number
}

export type StatsChartCategory = {
  category: string
  label: string
  bars: StatsChartBar[]
  total: number
}

export type StatsTopChoice = {
  choiceId: string
  label: string
  category: string
  categoryLabel: string
  image: string
  count: number
}

export type StatsFriendRank = {
  userId: string
  username: string
  displayName: string
  uniqueDays: number
  rank: number
  isSelf: boolean
}

export type StatsFriendsBoard = {
  ranks: StatsFriendRank[]
  selfRank: number | null
  total: number
}

export type StatsRecoPerformance = {
  totalRecommended: number
  planned: number
  watching: number
  paused: number
  completed: number
  ignored: number
}

export type UserQuizStats = {
  streak: StatsStreak
  activity: StatsActivity
  chartsByCategory: StatsChartCategory[]
  topChoices: StatsTopChoice[]
  friends: StatsFriendsBoard
  performance: StatsRecoPerformance
}
