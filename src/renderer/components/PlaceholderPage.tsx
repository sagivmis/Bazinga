interface Props {
  title: string
  description: string
}

export default function PlaceholderPage({ title, description }: Props) {
  return (
    <div className="page-content">
      <h1 className="page-title">{title}</h1>
      <p className="page-desc">{description}</p>
      <div className="panel placeholder-card">
        <span>Coming soon</span>
      </div>
    </div>
  )
}
