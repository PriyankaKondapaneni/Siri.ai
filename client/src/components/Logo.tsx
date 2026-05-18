import clsx from 'clsx';

export default function Logo({ size = 28, withText = true, className }: { size?: number; withText?: boolean; className?: string }) {
  return (
    <div className={clsx('flex items-center gap-2', className)}>
      <svg width={size} height={size} viewBox="0 0 32 32" className="shrink-0">
        <defs>
          <linearGradient id="logo-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#6d28d9" />
          </linearGradient>
        </defs>
        <rect width="32" height="32" rx="8" fill="url(#logo-grad)" />
        <path
          d="M11 10c0-1.5 1.3-3 3.5-3s3.5 1.5 3.5 3c0 1.3-.7 2.1-2.2 2.7l-1.8.8c-1.5.6-2.5 1.6-2.5 3.2 0 1.8 1.6 3.3 4 3.3 2.6 0 4-1.4 4-3.1"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
        />
        <circle cx="16" cy="23" r="1.4" fill="white" />
      </svg>
      {withText && (
        <span className="text-lg font-semibold tracking-tight text-ink-900">siri.ai</span>
      )}
    </div>
  );
}
