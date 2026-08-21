import questionsData from '../assets/questionsCards.json'
import type { QuizChoice, QuizData, QuizQuestion } from '../types/quiz'
import { publicAsset } from './publicPath'

const quizData = questionsData as QuizData

export const QUIZ_CATEGORY_LABELS: Record<string, string> = {
  constructionNarrative: 'Construction\u00A0narrative',
  etresSurnaturel: 'Êtres\u00A0surnaturels',
  forcePouvoir: 'Forces\u00A0/\u00A0pouvoirs',
  temporalite: 'Temporalité',
  tonaliteEmotionnelle: 'Tonalité\u00A0émotionnelle',
  typeDeProta: 'Type de\u00A0protagoniste',
  univers: 'Univers',
}

export const QUIZ_CATEGORY_ORDER = [
  'etresSurnaturel',
  'temporalite',
  'univers',
  'constructionNarrative',
  'typeDeProta',
  'tonaliteEmotionnelle',
  'forcePouvoir',
] as const

const questionByCategory = new Map<string, QuizQuestion>()
const choiceById = new Map<string, QuizChoice & { category: string; questionId: string }>()

for (const question of quizData.questions) {
  questionByCategory.set(question.category, question)
  for (const choice of question.choices) {
    choiceById.set(choice.id, {
      ...choice,
      category: question.category,
      questionId: question.id,
    })
  }
}

export function getQuizCategoryLabel(category: string) {
  return QUIZ_CATEGORY_LABELS[category] ?? category
}

export function getQuizChoiceMeta(choiceId: string) {
  return choiceById.get(choiceId) ?? null
}

export function getQuizChoicesForCategory(category: string): QuizChoice[] {
  return questionByCategory.get(category)?.choices ?? []
}

export function quizChoiceImageSrc(imagePath: string) {
  return publicAsset(imagePath.replace(/^\//, ''))
}
