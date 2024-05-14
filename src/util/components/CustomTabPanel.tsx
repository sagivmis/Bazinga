import clsx from "clsx"
import "./custom-tab-panel.css"

interface TabPanelProps {
  children?: React.ReactNode
  index: number
  value: number
  className?: string
}

export const CustomTabPanel = (props: TabPanelProps) => {
  const { children, className, value, index, ...other } = props

  return (
    <div
      role='tabpanel'
      hidden={value !== index}
      className={clsx("tab-panel", className)}
      {...other}
    >
      {value === index && <>{children}</>}
    </div>
  )
}
