import Watchlist from "../Watchlist"
import "./bali-bot.css"
import Statistics from "../Statistics"
import ControlPanel from "../ControlPanel"
import Positions from "../Positions"

function BaliBot() {
  return (
    <div className='bali-bot-app'>
      <div className='top-container'>
        <Watchlist />
        <Statistics />
      </div>
      <div className='bottom-container'>
        <Positions />
        <ControlPanel />
      </div>
    </div>
  )
}

export default BaliBot
