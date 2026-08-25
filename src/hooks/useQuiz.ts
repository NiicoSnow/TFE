import { useCallback, useRef, useState } from 'react'
import questionsData from '../assets/questionsCards.json'
import poolData from '../assets/quizAnimePool.json'
import { QUIZ_QUESTION_COUNT, QUIZ_RESULT_COUNT, QUIZ_RESULT_RANK_DEPTH, QUIZ_SKIPPED_CHOICE_ID } from '../lib/quizConfig'
import { getFixedFirstQuestion, pickNextQuestion } from '../lib/quizSelection'
import { rankAnimePool } from '../lib/quizScoring'
import type {
  QuizAnswers,
  QuizData,
  QuizAnimePool,
  QuizPhase,
  QuizQuestion,
  ScoredAnime,
} from '../types/quiz'

const quizData = questionsData as QuizData
const animePool = poolData as QuizAnimePool
const allQuestions = quizData.questions

export type QuizCompletePayload = {
  askedQuestions: QuizQuestion[]
  answers: QuizAnswers
  results: ScoredAnime[]
}

type UseQuizOptions = {
  onComplete?: (payload: QuizCompletePayload) => void
  getExcludeAnilistIds?: () => Promise<ReadonlySet<number>>
}

function createFirstQuestion(): QuizQuestion[] {
  const first = getFixedFirstQuestion(allQuestions)
  return first ? [first] : []
}

export function useQuiz(options?: UseQuizOptions) {
  const onCompleteRef = useRef(options?.onComplete)
  onCompleteRef.current = options?.onComplete
  const getExcludeAnilistIdsRef = useRef(options?.getExcludeAnilistIds)
  getExcludeAnilistIdsRef.current = options?.getExcludeAnilistIds

  const [phase, setPhase] = useState<QuizPhase>('quiz')
  const [questions, setQuestions] = useState<QuizQuestion[]>(createFirstQuestion)
  const [questionIndex, setQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<QuizAnswers>({})
  const [results, setResults] = useState<ScoredAnime[]>([])

  const currentQuestion = questions[questionIndex] ?? null
  const selectedChoiceId = currentQuestion
    ? answers[currentQuestion.id]
    : undefined
  const isLastQuestion = questionIndex >= QUIZ_QUESTION_COUNT - 1
  const progressLabel = `${Math.min(questionIndex + 1, QUIZ_QUESTION_COUNT)} / ${QUIZ_QUESTION_COUNT}`

  const selectChoice = useCallback(
    (choiceId: string) => {
      if (!currentQuestion || phase !== 'quiz') return

      const nextAnswers: QuizAnswers = {
        ...answers,
        [currentQuestion.id]: choiceId,
      }
      setAnswers(nextAnswers)

      if (isLastQuestion) {
        void (async () => {
          const excludeIds = (await getExcludeAnilistIdsRef.current?.()) ?? new Set()
          const ranked = rankAnimePool(animePool.animes, nextAnswers, QUIZ_RESULT_RANK_DEPTH, excludeIds)
          setResults(ranked)
          setPhase('results')
          onCompleteRef.current?.({
            askedQuestions: questions,
            answers: nextAnswers,
            results: ranked.slice(0, QUIZ_RESULT_COUNT),
          })
        })()
        return
      }

      const nextIndex = questionIndex + 1
      const nextQuestion = pickNextQuestion(
        allQuestions,
        nextAnswers,
        animePool.animes,
        nextIndex,
      )

      if (!nextQuestion) return

      setQuestions((prev) => [...prev.slice(0, nextIndex), nextQuestion])
      setQuestionIndex(nextIndex)
    },
    [answers, currentQuestion, isLastQuestion, phase, questionIndex, questions],
  )

  const skipQuestion = useCallback(() => {
    if (!currentQuestion || phase !== 'quiz') return

    const nextAnswers: QuizAnswers = {
      ...answers,
      [currentQuestion.id]: QUIZ_SKIPPED_CHOICE_ID,
    }
    setAnswers(nextAnswers)

    if (isLastQuestion) {
      void (async () => {
        const excludeIds = (await getExcludeAnilistIdsRef.current?.()) ?? new Set()
        const ranked = rankAnimePool(animePool.animes, nextAnswers, QUIZ_RESULT_RANK_DEPTH, excludeIds)
        setResults(ranked)
        setPhase('results')
        onCompleteRef.current?.({
          askedQuestions: questions,
          answers: nextAnswers,
          results: ranked.slice(0, QUIZ_RESULT_COUNT),
        })
      })()
      return
    }

    const nextIndex = questionIndex + 1
    const nextQuestion = pickNextQuestion(
      allQuestions,
      nextAnswers,
      animePool.animes,
      nextIndex,
    )

    if (!nextQuestion) return

    setQuestions((prev) => [...prev.slice(0, nextIndex), nextQuestion])
    setQuestionIndex(nextIndex)
  }, [answers, currentQuestion, isLastQuestion, phase, questionIndex, questions])

  const restart = useCallback(() => {
    setPhase('quiz')
    setQuestions(createFirstQuestion())
    setQuestionIndex(0)
    setAnswers({})
    setResults([])
  }, [])

  const goBack = useCallback(() => {
    if (phase === 'results' || questionIndex === 0) return
    setQuestionIndex((i) => i - 1)
  }, [phase, questionIndex])

  return {
    phase,
    questions,
    currentQuestion,
    selectedChoiceId,
    questionIndex,
    progressLabel,
    answers,
    results,
    selectChoice,
    skipQuestion,
    restart,
    goBack,
    canGoBack: phase === 'quiz' && questionIndex > 0,
    canSkip: phase === 'quiz',
  }
}
