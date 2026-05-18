import clsx from 'clsx';

export default function Logo({
  size = 22,
  withText = true,
  className,
  textClass,
}: {
  size?: number;
  withText?: boolean;
  className?: string;
  textClass?: string;
}) {
  return (
    <div className={clsx('flex items-center gap-1.5', className)}>
      <svg width={size} height={size} viewBox="0 0 32 32" className="shrink-0">
        <rect width="32" height="32" rx="7" fill="#18181b" />
        <path
          d="M11 11.5c0-1.6 1.4-2.8 3.5-2.8s3.5 1.2 3.5 2.7c0 1.2-.7 1.9-2.1 2.5l-1.7.7c-1.4.6-2.4 1.4-2.4 3 0 1.7 1.5 3 4 3 2.5 0 3.9-1.2 3.9-2.9"
          stroke="white"
          strokeWidth="1.8"
          strokeLinecap="round"
          fill="none"
        />
        <circle cx="16" cy="24" r="1.1" fill="white" />
      </svg>
      {withText && (
        <span className={clsx('font-semibold tracking-tight text-ink-900', textClass || 'text-base')}>
          siri.ai
        </span>
      )}
    </div>
  );
}
