import {
  ADAPTIVE_FROM_QUESTION_INDEX,
  FIXED_FIRST_QUESTION_ID,
} from './quizConfig'
import { rankAnimePool } from './quizScoring'
import type { QuizAnimePoolEntry, QuizAnswers, QuizQuestion } from '../types/quiz'

function randomIndex(max: number): number {
  return Math.floor(Math.random() * max)
}

export function getRemainingQuestions(
  all: QuizQuestion[],
  answers: QuizAnswers,
): QuizQuestion[] {
  const answeredIds = new Set(Object.keys(answers))
  return all.filter((q) => !answeredIds.has(q.id))
}

export function getFixedFirstQuestion(all: QuizQuestion[]): QuizQuestion | null {
  return all.find((q) => q.id === FIXED_FIRST_QUESTION_ID) ?? null
}

export function pickRandomQuestion(
  all: QuizQuestion[],
  answers: QuizAnswers,
): QuizQuestion | null {
  const remaining = getRemainingQuestions(all, answers)
  if (remaining.length === 0) return null
  return remaining[randomIndex(remaining.length)]!
}

/** Écart moyen 1er / 2e anime selon les réponses possibles à cette question. */
export function questionDiscriminationScore(
  question: QuizQuestion,
  answers: QuizAnswers,
  pool: QuizAnimePoolEntry[],
): number {
  if (question.choices.length === 0) return 0

  let totalGap = 0
  for (const choice of question.choices) {
    const simulated: QuizAnswers = {
      ...answers,
      [question.id]: choice.id,
    }
    const ranked = rankAnimePool(pool, simulated, 2)
    const gap =
      ranked.length >= 2
        ? ranked[0]!.score - ranked[1]!.score
        : (ranked[0]?.score ?? 0)
    totalGap += gap
  }

  return totalGap / question.choices.length
}

export function pickMostDiscriminatingQuestion(
  remaining: QuizQuestion[],
  answers: QuizAnswers,
  pool: QuizAnimePoolEntry[],
): QuizQuestion | null {
  if (remaining.length === 0) return null

  let bestScore = -1
  let best: QuizQuestion[] = []

  for (const question of remaining) {
    const score = questionDiscriminationScore(question, answers, pool)
    if (score > bestScore) {
      bestScore = score
      best = [question]
    } else if (score === bestScore) {
      best.push(question)
    }
  }

  return best[randomIndex(best.length)]!
}

export function pickNextQuestion(
  all: QuizQuestion[],
  answers: QuizAnswers,
  pool: QuizAnimePoolEntry[],
  nextIndex: number,
): QuizQuestion | null {
  const remaining = getRemainingQuestions(all, answers)
  if (remaining.length === 0) return null

  if (nextIndex < ADAPTIVE_FROM_QUESTION_INDEX) {
    return pickRandomQuestion(all, answers)
  }

  return (
    pickMostDiscriminatingQuestion(remaining, answers, pool) ??
    pickRandomQuestion(all, answers)
  )
}
