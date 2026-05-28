import { publicAsset } from '../lib/publicPath'

export type StreakDisplayProps = {
  value: number | string
  className?: string
  src?: string
  alt?: string
}

export function StreakDisplay({
  value,
  className,
  src = publicAsset('assets/streak.svg'),
  alt = 'Flamme symbolisant un streak',
}: StreakDisplayProps) {
  return (
    <div className={['streak-display', className].filter(Boolean).join(' ')}>
      <img src={src} alt={alt} className="streak-display__img" width={105} height={120} />
      <span className="streak-display__value">{value}</span>
    </div>
  )
}
