export type QuizChoice = {
  id: string
  label: string
  image: string
  alt: string
}

export type QuizQuestion = {
  id: string
  category: string
  title: string
  choices: QuizChoice[]
}

export type QuizData = {
  id: string
  questions: QuizQuestion[]
}

export type QuizAnswers = Partial<Record<string, string>>

export type QuizAnimePoolEntry = {
  anilistId: number
  title: string
  weights: Partial<Record<string, number>>
}

export type QuizAnimePool = {
  animes: QuizAnimePoolEntry[]
}

export type ScoredAnime = {
  anilistId: number
  title: string
  score: number
}

export type AffinityBreakdownItem = {
  questionTitle: string
  choiceLabel: string
  points: number
}

export type QuizPhase = 'quiz' | 'results'
