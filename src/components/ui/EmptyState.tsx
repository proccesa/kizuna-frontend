import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

/** Estado vacío: una conversación que todavía no empieza. */
export function EmptyState({ title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center px-6 py-16 text-center', className)}>
      <svg width="96" height="64" viewBox="0 0 96 64" aria-hidden>
        <path d="M14 4h34a12 12 0 0 1 12 12v8a12 12 0 0 1-12 12H24l-12 10 2-10.4A12 12 0 0 1 2 24v-8A12 12 0 0 1 14 4Z" fill="#E7E1F2" />
        <circle cx="19" cy="20" r="3" fill="#4E3F6B" />
        <circle cx="31" cy="20" r="3" fill="#4E3F6B" opacity=".6" />
        <circle cx="43" cy="20" r="3" fill="#4E3F6B" opacity=".3" />
        <path d="M50 26h32a12 12 0 0 1 12 12v6a12 12 0 0 1-9.4 11.7L86 64l-11-8H50a12 12 0 0 1-12-12v-6a12 12 0 0 1 12-12Z" fill="none" stroke="#DCD1C2" strokeWidth="2" strokeDasharray="4 4" />
      </svg>
      <h3 className="mt-5 text-lg font-bold">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-muted">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
