import { useCallback, useLayoutEffect, useRef, useState } from 'react'
import { animateCardsEnter, animateCardsExit, getChoiceCards, } from '../lib/quizCardAnimations'
import type { QuizQuestion as QuizQuestionType } from '../types/quiz'
import { QuizChoiceCard } from './QuizChoiceCard'

type QuizQuestionProps = {
  question: QuizQuestionType
  selectedChoiceId: string | undefined
  progressLabel: string
  canGoBack: boolean
  onBack: () => void
  onSelect: (choiceId: string) => void
}

export function QuizQuestion({
  question,
  selectedChoiceId,
  progressLabel,
  canGoBack,
  onBack,
  onSelect,
}: QuizQuestionProps) {
  const choicesRef = useRef<HTMLDivElement>(null)
  const [isAnimating, setIsAnimating] = useState(false)

  useLayoutEffect(() => {
    const cards = getChoiceCards(choicesRef.current)
    animateCardsEnter(cards)
  }, [question.id])

  const handleSelect = useCallback(
    (choiceId: string) => {
      if (isAnimating) return

      const container = choicesRef.current
      const cards = getChoiceCards(container)
      const selectedCard = container?.querySelector<HTMLElement>(
        `[data-choice-id="${choiceId}"]`,
      )

      if (!selectedCard || cards.length === 0) {
        onSelect(choiceId)
        return
      }

      setIsAnimating(true)

      animateCardsExit(cards, selectedCard, () => {
        onSelect(choiceId)
        setIsAnimating(false)
      })
    },
    [isAnimating, onSelect],
  )

  return (
    <div className="quiz-question">
      <div className="quiz-question__header">
        {canGoBack ? (
          <button
            type="button"
            className="quiz-question__back"
            onClick={onBack}
            disabled={isAnimating}
          >
            Retour
          </button>
        ) : (
          <span className="quiz-question__back-spacer" aria-hidden />
        )}
        <p className="quiz-question__progress" aria-live="polite">
          Question {progressLabel}
        </p>
      </div>
      <h2 className="quiz-question__title">{question.title}</h2>
      <div
        ref={choicesRef}
        className={
          isAnimating
            ? 'cards grid quiz-question__choices quiz-question__choices--busy'
            : 'cards grid quiz-question__choices'
        }
        role="group"
        aria-label={question.title}
      >
        {question.choices.map((choice) => (
          <QuizChoiceCard
            key={choice.id}
            choice={choice}
            selected={selectedChoiceId === choice.id}
            disabled={isAnimating}
            onSelect={() => handleSelect(choice.id)}
          />
        ))}
      </div>
    </div>
  )
}
