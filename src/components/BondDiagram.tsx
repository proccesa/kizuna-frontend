import type { ReactNode } from 'react';
import { Bubble } from '@/components/brand/Bubble';

interface BondSide {
  label: string;
  title?: ReactNode;
  lines?: ReactNode[];
  emptyText?: string;
  action?: ReactNode;
}

interface BondDiagramProps {
  from: BondSide;
  to: BondSide;
  linked: boolean;
}

/**
 * El vínculo entre dos registros contado como una conversación:
 * un globo de cada lado. Si falta uno, el segundo queda punteado esperando respuesta.
 */
export function BondDiagram({ from, to, linked }: BondDiagramProps) {
  return (
    <div className="flex flex-col gap-2.5">
      <Bubble tone="mist" className="max-w-[85%] self-start">
        <p className="text-xs font-semibold opacity-75">{from.label}</p>
        <p className="mt-0.5 font-semibold">{from.title}</p>
        {from.lines?.filter(Boolean).map((line, i) => (
          <p key={i} className="text-[0.8rem] opacity-80">
            {line}
          </p>
        ))}
      </Bubble>

      {linked ? (
        <Bubble tone="lime" side="right" className="max-w-[85%] self-end">
          <p className="text-xs font-semibold opacity-75">{to.label}</p>
          <p className="mt-0.5 font-semibold">{to.title}</p>
          {to.lines?.filter(Boolean).map((line, i) => (
            <p key={i} className="text-[0.8rem] opacity-80">
              {line}
            </p>
          ))}
        </Bubble>
      ) : (
        <div className="max-w-[85%] self-end rounded-[1.25rem] rounded-br-[0.3rem] border-2 border-dashed border-line-strong px-4 py-3">
          <p className="text-xs font-semibold text-muted">{to.label}</p>
          <p className="mt-0.5 text-sm text-muted">{to.emptyText}</p>
          {to.action && <div className="mt-2.5">{to.action}</div>}
        </div>
      )}
    </div>
  );
}
