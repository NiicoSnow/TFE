import { StreakDisplay } from './StreakDisplay'

export function VersusSection() {
    return (
        <section className="versus grid">
            <h2>Comparaison avec un ami</h2>
            <div className="versus__element">
                <h3 className="versus__name">Moi</h3>
                <span className="versus__line"></span>
                <div className="versus__number-container">
                    <span className="versus__number">85</span>
                    <h4>Cartes tirés</h4>
                </div>
                <div className="versus__number-container">
                    <span className="versus__number">17</span>
                    <h4>Tirages fait</h4>
                </div>
                <div className="versus__number-container column streak ">
                    <StreakDisplay value={12} />
                    <h4 className="text-center">Tirages unique</h4>
                </div>
            </div>
            <h1 className="versus__vs text-center">VS</h1>
            <div className="versus__element">
                <h3 className="versus__name">Mirk</h3>
                <span className="versus__line"></span>
                <div className="versus__number-container">
                    <span className="versus__number">85</span>
                    <h4>Cartes tirés</h4>
                </div>
                <div className="versus__number-container">
                    <span className="versus__number">17</span>
                    <h4>Tirages fait</h4>
                </div>
                <div className="versus__number-container column streak ">
                    <StreakDisplay value={12} />
                    <h4 className="text-center">Tirages unique</h4>
                </div>
            </div>
        </section>
    )
}