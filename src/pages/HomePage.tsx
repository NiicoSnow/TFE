import { MiniStatsSection } from '../components/MiniStatsSection'
import { TutoSection } from '../components/TutoSection'
import { VersusSection } from '../components/VersusSection'

export function HomePage() {
  return (
    <main className="home-page">
      <TutoSection />
      <MiniStatsSection />
      <VersusSection />
    </main>
  )
}
