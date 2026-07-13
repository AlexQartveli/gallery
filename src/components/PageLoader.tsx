import './PageLoader.css'

export default function PageLoader({ label = 'Загрузка…' }: { label?: string }) {
  return (
    <div className="page-loader" role="status" aria-live="polite">
      <span className="page-loader__mark">◆</span>
      <p>{label}</p>
    </div>
  )
}
