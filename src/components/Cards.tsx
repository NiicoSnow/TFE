import { useCallback, useRef } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useQuiz, type QuizCompletePayload } from '../hooks/useQuiz'
import { getUserLibraryAnilistIds } from '../lib/animeLibrary'
import {
  appendQuizSessionRecommendation,
  saveCompletedQuizSession,
} from '../lib/quizStats'
import type { ScoredAnime } from '../types/quiz'
import { QuizQuestion } from './QuizQuestion'
import { QuizResults } from './QuizResults'

export function Cards() {
  const { user } = useAuth()
  const userId = user?.id
  const savingRef = useRef(false)
  const sessionIdRef = useRef<string | null>(null)
  const pendingRecommendationsRef = useRef<ScoredAnime[]>([])

  const flushPendingRecommendations = useCallback(
    async (sessionId: string) => {
      if (!userId) return
      const pending = pendingRecommendationsRef.current
      pendingRecommendationsRef.current = []
      for (const anime of pending) {
        try {
          await appendQuizSessionRecommendation(userId, sessionId, anime)
        } catch (err) {
          console.error('Échec enregistrement recommandation:', err)
        }
      }
    },
    [userId],
  )

  const handleComplete = useCallback(
    (payload: QuizCompletePayload) => {
      if (!userId || savingRef.current) return
      savingRef.current = true
      sessionIdRef.current = null
      pendingRecommendationsRef.current = []
      void saveCompletedQuizSession({ userId, ...payload })
        .then(async (sessionId) => {
          sessionIdRef.current = sessionId
          await flushPendingRecommendations(sessionId)
        })
        .catch((err) => {
          console.error('Échec enregistrement du tirage:', err)
        })
        .finally(() => {
          savingRef.current = false
        })
    },
    [userId, flushPendingRecommendations],
  )

  const getExcludeAnilistIds = useCallback(async () => {
    if (!userId) return new Set<number>()
    try {
      return await getUserLibraryAnilistIds(userId)
    } catch {
      return new Set<number>()
    }
  }, [userId])

  const recordRecommendation = useCallback(
    (anime: ScoredAnime) => {
      if (!userId) return
      const sessionId = sessionIdRef.current
      if (!sessionId) {
        pendingRecommendationsRef.current.push(anime)
        return
      }
      void appendQuizSessionRecommendation(userId, sessionId, anime).catch((err) => {
        console.error('Échec enregistrement recommandation:', err)
      })
    },
    [userId],
  )

  const {
    phase,
    questions,
    currentQuestion,
    selectedChoiceId,
    progressLabel,
    answers,
    results,
    selectChoice,
    skipQuestion,
    restart,
    goBack,
    canGoBack,
    canSkip,
  } = useQuiz({ onComplete: handleComplete, getExcludeAnilistIds })

  const handleRestart = useCallback(() => {
    savingRef.current = false
    sessionIdRef.current = null
    pendingRecommendationsRef.current = []
    restart()
  }, [restart])

  if (phase === 'results') {
    return (
      <QuizResults
        results={results}
        answers={answers}
        askedQuestions={questions}
        onRestart={handleRestart}
        onRecommendationShown={recordRecommendation}
      />
    )
  }

  if (!currentQuestion) {
    return <p>Aucune question disponible pour le quiz.</p>
  }

  return (
    <QuizQuestion
      question={currentQuestion}
      selectedChoiceId={selectedChoiceId}
      progressLabel={progressLabel}
      canGoBack={canGoBack}
      canSkip={canSkip}
      onBack={goBack}
      onSkip={skipQuestion}
      onSelect={selectChoice}
    />
  )
}
