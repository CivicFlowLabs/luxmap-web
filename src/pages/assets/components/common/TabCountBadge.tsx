import React from 'react'

export interface TabCountBadgeProps {
  count: number
  isLoading?: boolean
  isActive: boolean
  colorScheme?: 'blue' | 'amber' | 'purple' | 'indigo'
}

export const TabCountBadge: React.FC<TabCountBadgeProps> = ({
  count,
  isLoading = false,
  isActive,
  colorScheme = 'blue',
}) => {
  if (isLoading) {
    return (
      <span
        aria-hidden="true"
        className="w-6 h-4 bg-slate-300/80 dark:bg-slate-700 animate-pulse rounded-full inline-block"
      />
    )
  }

  const activeColorClasses: Record<string, string> = {
    blue: 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200/70 dark:border-blue-800',
    amber: 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200/70 dark:border-amber-800',
    purple: 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200/70 dark:border-purple-800',
    indigo: 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/70 dark:border-indigo-800',
  }

  return (
    <span
      className={`px-2 py-0.5 rounded-full text-[10px] font-bold transition-colors ${
        isActive
          ? `${activeColorClasses[colorScheme]} shadow-2xs`
          : 'bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
      }`}
    >
      {count}
    </span>
  )
}
