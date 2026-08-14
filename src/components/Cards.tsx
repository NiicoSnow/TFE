import { useCallback, useRef } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useQuiz, type QuizCompletePayload } from '../hooks/useQuiz'
import { saveCompletedQuizSession } from '../lib/quizStats'
import { QuizQuestion } from './QuizQuestion'
import { QuizResults } from './QuizResults'

export function Cards() {
  const { user } = useAuth()
  const savingRef = useRef(false)

  const handleComplete = useCallback(
    (payload: QuizCompletePayload) => {
      if (!user?.id || savingRef.current) return
      savingRef.current = true
      void saveCompletedQuizSession({ userId: user.id, ...payload })
        .catch((err) => {
          console.error('Échec enregistrement du tirage:', err)
        })
        .finally(() => {
          savingRef.current = false
        })
    },
    [user?.id],
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
    restart,
    goBack,
    canGoBack,
  } = useQuiz({ onComplete: handleComplete })

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
      onBack={goBack}
      onSelect={selectChoice}
    />
  )
}
