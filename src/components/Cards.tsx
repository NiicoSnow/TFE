import { useCallback, useRef } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useQuiz, type QuizCompletePayload } from '../hooks/useQuiz'
import { getUserLibraryAnilistIds } from '../lib/animeLibrary'
import { saveCompletedQuizSession } from '../lib/quizStats'
import { QuizQuestion } from './QuizQuestion'
import { QuizResults } from './QuizResults'

export function Cards() {
  const { user } = useAuth()
  const userId = user?.id
  const savingRef = useRef(false)

  const handleComplete = useCallback(
    (payload: QuizCompletePayload) => {
      if (!userId || savingRef.current) return
      savingRef.current = true
      void saveCompletedQuizSession({ userId, ...payload })
        .catch((err) => {
          console.error('Échec enregistrement du tirage:', err)
        })
        .finally(() => {
          savingRef.current = false
        })
    },
    [userId],
  )

  const getExcludeAnilistIds = useCallback(async () => {
    if (!userId) return new Set<number>()
    try {
      return await getUserLibraryAnilistIds(userId)
    } catch {
      return new Set<number>()
    }
  }, [userId])

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
    restart()
  }, [restart])

  if (phase === 'results') {
    return (
      <QuizResults
        results={results}
        answers={answers}
        askedQuestions={questions}
        onRestart={handleRestart}
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
