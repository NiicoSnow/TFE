import { AnimeManagtSection } from '../components/AnimeManagtSection'
import { MiniStatsSection } from '../components/MiniStatsSection'
import { TutoSection } from '../components/TutoSection'
import { VersusSection } from '../components/VersusSection'

export function HomePage() {
  return (
    <main className="home-page">
      <header className="home-page__header">
        <h1>Cardtaku</h1>
      </header>
      <TutoSection />
      <MiniStatsSection />  
      <VersusSection />
      <AnimeManagtSection />
    </main>
  )
}
