import { ToggleButton, ToggleButtonGroup } from "@mui/material"
import React from "react"
import RssFeedIcon from "@mui/icons-material/RssFeed"
import QuestionMarkIcon from "@mui/icons-material/QuestionMark"
import { useEffect, useState } from "react"
import { useBinanceContext } from "../../providers/BinanceProvider"
import "./control-panel.css"
const defaultToggles = ["live-feed"]

const ControlPanel = () => {
  const { setIsLiveFeed, isLiveFeed } = useBinanceContext()
  const [toggles, setToggles] = useState<string[]>(
    isLiveFeed ? defaultToggles : []
  )

  const handleControls = (
    _: React.MouseEvent<HTMLElement>,
    newToggles: string[]
  ) => {
    console.log(newToggles)
    setToggles(newToggles)
  }

  useEffect(() => {
    setIsLiveFeed(toggles.includes("live-feed"))
  }, [setIsLiveFeed, toggles])
  return (
    <div className='user-control-container'>
      <ToggleButtonGroup
        className='control-panel'
        value={toggles}
        onChange={handleControls}
      >
        <ToggleButton
          value='live-feed'
          className='toggle-btn'
          classes={{ selected: "selected" }}
        >
          <RssFeedIcon className='live-feed-icon icon' />
        </ToggleButton>
        <ToggleButton
          value='question'
          className='toggle-btn'
          classes={{ selected: "selected" }}
          disabled
        >
          <QuestionMarkIcon className='question-icon icon' />
        </ToggleButton>
        <ToggleButton
          value='question2'
          className='toggle-btn'
          classes={{ selected: "selected" }}
          disabled
        >
          <QuestionMarkIcon className='question-icon icon' />
        </ToggleButton>
      </ToggleButtonGroup>
    </div>
  )
}

export default ControlPanel
