import type { QuizChoice } from '../types/quiz'

type QuizChoiceCardProps = {
  choice: QuizChoice
  selected: boolean
  disabled?: boolean
  onSelect: () => void
}

export function QuizChoiceCard({
  choice,
  selected,
  disabled = false,
  onSelect,
}: QuizChoiceCardProps) {
  return (
    <button
      type="button"
      data-choice-id={choice.id}
      className={selected ? 'cards__element cards__element--selected' : 'cards__element'}
      onClick={onSelect}
      disabled={disabled}
      aria-pressed={selected}
    >
      <div className="cards__element--img">
        <img src={choice.image} alt={choice.alt || choice.label} loading="lazy" />
        <h3>{choice.label}</h3>
      </div>
    </button>
  )
}
