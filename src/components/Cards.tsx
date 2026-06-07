import { useQuiz } from '../hooks/useQuiz'
import { QuizQuestion } from './QuizQuestion'
import { QuizResults } from './QuizResults'

export function Cards() {
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
  } = useQuiz()

  if (phase === 'results') {
    return (
      <QuizResults
        results={results}
        answers={answers}
        askedQuestions={questions}
        onRestart={restart}
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
