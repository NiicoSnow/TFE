import gsap from 'gsap'

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

function exitOffsetY(): number {
  return typeof window !== 'undefined' ? window.innerHeight * 0.55 : 400
}

export function getChoiceCards(container: HTMLElement | null): HTMLElement[] {
  if (!container) return []
  return gsap.utils.toArray<HTMLElement>(
    container.querySelectorAll('.cards__element'),
  )
}

export function animateCardsEnter(
  cards: HTMLElement[],
): gsap.core.Tween | gsap.core.Timeline | null {
  if (cards.length === 0) return null

  gsap.killTweensOf(cards)

  if (prefersReducedMotion()) {
    gsap.set(cards, { y: 0, opacity: 1 })
    return null
  }

  gsap.set(cards, { y: exitOffsetY(), opacity: 0 })

  return gsap.to(cards, {
    y: 0,
    opacity: 1,
    duration: 0.65,
    stagger: 0.08,
    ease: 'power3.out',
  })
}

export function animateCardsExit(
  cards: HTMLElement[],
  selected: HTMLElement,
  onComplete: () => void,
): gsap.core.Timeline {
  const others = cards.filter((card) => card !== selected)

  gsap.killTweensOf(cards)

  if (prefersReducedMotion()) {
    onComplete()
    return gsap.timeline()
  }

  const tl = gsap.timeline({ onComplete })

  if (others.length > 0) {
    tl.to(others, {
      y: exitOffsetY(),
      opacity: 0,
      duration: 0.5,
      stagger: 0.06,
      ease: 'power2.in',
    })
  }

  tl.to(
    selected,
    {
      y: exitOffsetY(),
      opacity: 0,
      duration: 0.45,
      ease: 'power2.in',
    },
    others.length > 0 ? '+=0.10' : 0,
  )

  return tl
}
