import { cn } from '@/lib/cn';

export interface FilterTab<T extends string> {
  value: T;
  label: string;
  count?: number;
}

interface FilterTabsProps<T extends string> {
  value: T;
  onChange: (value: T) => void;
  tabs: FilterTab<T>[];
  'aria-label': string;
  className?: string;
}

/** Filtros en forma de píldoras con contador. */
export function FilterTabs<T extends string>({ value, onChange, tabs, className, ...aria }: FilterTabsProps<T>) {
  return (
    <div role="tablist" aria-label={aria['aria-label']} className={cn('flex gap-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden', className)}>
      {tabs.map((tab) => {
        const active = tab.value === value;
        return (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(tab.value)}
            className={cn(
              'flex h-9 cursor-pointer items-center gap-2 rounded-full px-3.5 text-sm font-semibold whitespace-nowrap transition-colors',
              active ? 'bg-petrol text-white' : 'text-body hover:bg-sand',
            )}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span className={cn('tabular rounded-full px-1.5 text-xs', active ? 'bg-white/20 text-white' : 'bg-sand text-muted')}>{tab.count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
