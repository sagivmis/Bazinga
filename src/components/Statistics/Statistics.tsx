import { Tab, Tabs, Typography } from "@mui/material"
import "./statistics.css"
import { useMemo, useState } from "react"
import {
  CustomTabPanel,
  formatNISAsNumber,
  formatNISAsString
} from "../../util"
import clsx from "clsx"
import { useBinanceContext } from "../../providers/BinanceProvider"

function a11yProps(index: number) {
  return {
    id: `vertical-tab-${index}`,
    "aria-controls": `vertical-tabpanel-${index}`
  }
}

const Statistics = () => {
  const {
    futuresUsdtBalance: balance,
    pnl,
    openPositions
  } = useBinanceContext()
  const [selectedTabIndex, setSelectedTabIndex] = useState(0)

  const handleChange = (_: React.SyntheticEvent, newValue: number) => {
    setSelectedTabIndex(newValue)
  }

  const margin = useMemo(() => formatNISAsNumber(balance) + pnl, [balance, pnl])
  return (
    <div className='stats-container'>
      <div className='statistics'>
        <Tabs
          TabIndicatorProps={{ hidden: true }}
          value={selectedTabIndex}
          onChange={handleChange}
          orientation='vertical'
          variant='scrollable'
        >
          <Tab
            label='Futures'
            tabIndex={0}
            classes={{ root: "tab-btn", selected: "selected" }}
            {...a11yProps(0)}
          />
          <Tab
            label='Spot'
            tabIndex={1}
            classes={{ root: "tab-btn", selected: "selected" }}
            {...a11yProps(1)}
          />
        </Tabs>
      </div>
      {["futures", "spot"].map((variant, index) => {
        return (
          <CustomTabPanel
            className={variant}
            value={selectedTabIndex}
            index={index}
          >
            <div className={clsx("user-statistics-container", variant)}>
              <div className='assets-statistics'>
                <Typography className='stat-row' variant='h6'>
                  <span className='stat-label'>USDT Balance:</span>
                  <span className='stat-value'>
                    {formatNISAsString(balance)}
                  </span>
                </Typography>
                <Typography className='stat-row' variant='h6'>
                  <span className='stat-label'>P&L:</span>
                  {pnl < 0 ? (
                    <span className='pnl-below-zero stat-value'>
                      ({Math.abs(pnl).toFixed(3)})
                    </span>
                  ) : (
                    <span className='pnl-below-zero stat-value'>
                      {Math.abs(pnl).toFixed(3)}
                    </span>
                  )}
                </Typography>
                <Typography className='stat-row' variant='h6'>
                  <span className='stat-label'>Margin:</span>
                  <span className='stat-value'>{margin.toFixed(3)} USDT</span>
                </Typography>
              </div>
              <div className='trades-statistics'>
                <Typography className='stat-row' variant='h6'>
                  <span className='stat-label'>Win Rate (%):</span>
                  <span className='stat-value'></span>
                </Typography>
                <Typography className='stat-row' variant='h6'>
                  <span className='stat-label'>Today's Win/Loss Ratio:</span>
                  <span className='stat-value'></span>
                </Typography>
                <Typography className='stat-row' variant='h6'>
                  <span className='stat-label'>Today's Gross Profit:</span>
                  <span className='stat-value'></span>
                </Typography>
                <Typography className='stat-row' variant='h6'>
                  <span className='stat-label'>Positions:</span>
                  <span className='stat-value'></span>
                </Typography>
                <Typography className='stat-row' variant='h6'>
                  <span className='stat-label'>Open Positions:</span>
                  <span className='stat-value'>{openPositions.length}</span>
                </Typography>
              </div>
            </div>
          </CustomTabPanel>
        )
      })}

      {/* <CustomTabPanel className='futures' value={selectedTabIndex} index={0}>
      </CustomTabPanel>
      <CustomTabPanel className='spot' value={selectedTabIndex} index={1}>
      </CustomTabPanel> */}
    </div>
  )
}

export default Statistics
