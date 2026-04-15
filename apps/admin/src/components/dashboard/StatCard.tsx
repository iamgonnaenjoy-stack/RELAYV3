import { LucideIcon } from 'lucide-react'

interface StatCardProps {
  label: string
  value: number
  icon: LucideIcon
}

export default function StatCard({ label, value, icon: Icon }: StatCardProps) {
  return (
    <div className="panel px-4 py-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-text-secondary">
          {label}
        </p>
        <Icon size={15} className="text-accent" />
      </div>
      <p className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-white">{value}</p>
    </div>
  )
}
