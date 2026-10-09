import { useState } from 'react';
import { Ban, CheckCircle2, DoorOpen, SearchCheck } from 'lucide-react';
import { Button, Card, Input, Select } from '@/components/ui';
import { getErrorMessage } from '@/lib/api/errors';
import { cn } from '@/lib/cn';
import { formatDateTime } from '@/lib/format';
import { notify } from '@/lib/toast';
import { hoyISO } from '@/modules/talento/schema';
import { inventarioService } from '../services/inventarioService';
import { TIPO_ITEM, type DetalleRequerimientos, type Verificacion } from '../types';

/**
 * Prueba lo que hará el motor de programación: ¿hay sala, equipos, cajas e insumos para este CUPS
 * en esta sede y horario?
 */
export function Verificador({ detalle }: { detalle: DetalleRequerimientos }) {
  const [sedeId, setSedeId] = useState(String(detalle.sedes[0]?.sede.id ?? ''));
  const [fecha, setFecha] = useState(hoyISO);
  const [hora, setHora] = useState('07:00');
  const [resultado, setResultado] = useState<Verificacion | null>(null);
  const [cargando, setCargando] = useState(false);

  const verificar = async () => {
    setCargando(true);
    try {
      setResultado(await inventarioService.verificar({ cups_id: detalle.cups.id, sede_id: Number(sedeId), fecha, hora }));
    } catch (e) {
      notify.error(getErrorMessage(e));
    } finally {
      setCargando(false);
    }
  };

  if (!detalle.sedes.length) return null;

  return (
    <Card className="p-5">
      <p className="flex items-center gap-2 font-display text-base font-bold text-ink">
        <SearchCheck className="size-4 text-mint-ink" aria-hidden /> Verificar disponibilidad
      </p>
      <p className="mt-0.5 text-sm text-muted">Lo mismo que revisará el motor de programación antes de proponer un cupo.</p>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end">
        <Select aria-label="Sede" value={sedeId} onChange={(e) => setSedeId(e.target.value)} options={detalle.sedes.map((s) => ({ value: s.sede.id, label: s.sede.nombre }))} className="h-10 sm:w-48" />
        <Input aria-label="Fecha" type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} className="h-10 sm:w-40" />
        <Input aria-label="Hora" type="time" value={hora} onChange={(e) => setHora(e.target.value)} className="h-10 sm:w-32" />
        <Button onClick={verificar} isLoading={cargando}>
          Verificar
        </Button>
      </div>

      {resultado && (
        <div className="mt-5 space-y-3">
          <div className={cn('flex items-start gap-3 rounded-2xl px-4 py-3', resultado.viable ? 'bg-success-soft text-success' : 'bg-danger-soft text-danger')}>
            {resultado.viable ? <CheckCircle2 className="mt-0.5 size-5 shrink-0" aria-hidden /> : <Ban className="mt-0.5 size-5 shrink-0" aria-hidden />}
            <div className="text-sm">
              <p className="font-semibold">{resultado.viable ? 'Se puede realizar' : 'No se puede realizar en ese horario'}</p>
              <p className="opacity-90">
                {formatDateTime(resultado.inicio)} – {resultado.fin.slice(11)}
                {resultado.sala && ` · ${resultado.sala.nombre}`}
              </p>
              {resultado.sin_requerimientos && <p className="mt-1">Este CUPS no tiene requerimientos: Kizuna no puede verificar recursos.</p>}
              {resultado.motivos.map((m) => (
                <p key={m} className="mt-1 flex items-center gap-1.5">
                  <DoorOpen className="size-4" aria-hidden /> {m}
                </p>
              ))}
            </div>
          </div>
          <ul className="divide-y divide-line rounded-2xl border border-line">
            {resultado.recursos.map((r) => (
              <li key={r.item.id} className="flex items-start gap-3 px-4 py-2.5 text-sm">
                {r.ok ? <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" aria-hidden /> : <Ban className="mt-0.5 size-4 shrink-0 text-danger" aria-hidden />}
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-ink">
                    {r.item.nombre} <span className="font-normal text-muted">· {TIPO_ITEM[r.item.tipo].singular}</span>
                  </p>
                  {r.asignables.length > 0 && <p className="tabular text-xs text-muted">Se usaría: {r.asignables.map((a) => a.codigo).join(', ')}</p>}
                  {r.motivos.length > 0 && <p className={cn('text-xs', r.ok ? 'text-muted' : 'text-danger')}>{r.motivos.join(' · ')}</p>}
                  {r.avisos.length > 0 && <p className="text-xs font-medium text-warning">{r.avisos.join(' · ')}</p>}
                </div>
                <span className={cn('tabular shrink-0 font-display font-bold', r.ok ? 'text-ink' : 'text-danger')}>
                  {r.disponible}/{r.requerido}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
}
