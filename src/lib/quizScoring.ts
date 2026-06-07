import type { AffinityBreakdownItem, QuizAnimePoolEntry, QuizAnswers, QuizQuestion, ScoredAnime} from '../types/quiz'

export function scoreAnimeEntry(
  entry: QuizAnimePoolEntry,
  answers: QuizAnswers,
): number {
  return Object.values(answers).reduce((sum, choiceId) => {
    if (choiceId == null) return sum
    return sum + (entry.weights[choiceId] ?? 0)
  }, 0)
}

export function rankAnimePool(
  pool: QuizAnimePoolEntry[],
  answers: QuizAnswers,
  limit = 3,
): ScoredAnime[] {
  const scored = pool
    .map((entry) => ({
      anilistId: entry.anilistId,
      title: entry.title,
      score: scoreAnimeEntry(entry, answers),
    }))
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score)

  if (scored.length === 0) {
    return pool.slice(0, limit).map((entry) => ({
      anilistId: entry.anilistId,
      title: entry.title,
      score: 0,
    }))
  }

  return scored.slice(0, limit)
}

export function getAffinityBreakdown(
  entry: QuizAnimePoolEntry,
  answers: QuizAnswers,
  askedQuestions: QuizQuestion[],
): AffinityBreakdownItem[] {
  return askedQuestions.flatMap((question) => {
    const choiceId = answers[question.id]
    if (!choiceId) return []

    const choice = question.choices.find((c) => c.id === choiceId)

    return [
      {
        questionTitle: question.title,
        choiceLabel: choice?.label ?? choiceId,
        points: entry.weights[choiceId] ?? 0,
      },
    ]
  })
}
