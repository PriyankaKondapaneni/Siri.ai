import { ReactNode } from 'react';

export default function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="h-11 px-5 border-b border-ink-200 bg-white flex items-center justify-between gap-4">
      <div className="flex items-baseline gap-2 min-w-0">
        <h1 className="text-[14px] font-semibold text-ink-900 truncate">{title}</h1>
        {subtitle && <span className="text-2xs text-ink-500 truncate">{subtitle}</span>}
      </div>
      {actions && <div className="flex items-center gap-1.5">{actions}</div>}
    </div>
  );
}
