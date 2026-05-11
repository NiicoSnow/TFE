import styles from './StreakDisplay.module.css'

export type StreakDisplayProps = {
  value: number | string
  className?: string
  src?: string
  alt?: string
}

export function StreakDisplay({
  value,
  className,
  src = '/streak.svg',
  alt = 'Flamme symbolisant un streak',
}: StreakDisplayProps) {
  return (
    <div className={[styles.root, className].filter(Boolean).join(' ')}>
      <img src={src} alt={alt} className={styles.img} width={105} height={120} />
      <span className={styles.value}>{value}</span>
    </div>
  )
}
