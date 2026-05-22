import { useQuiz } from '../hooks/useQuiz'
import { QuizQuestion } from './QuizQuestion'
import { QuizResults } from './QuizResults'

export function Cards() {
  const {
    phase,
    currentQuestion,
    selectedChoiceId,
    progressLabel,
    results,
    selectChoice,
    restart,
    goBack,
    canGoBack,
  } = useQuiz()

  if (phase === 'results') {
    return <QuizResults results={results} onRestart={restart} />
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
