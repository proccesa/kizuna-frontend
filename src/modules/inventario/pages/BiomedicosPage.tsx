import { FilterTabs, PageHeader } from '@/components/ui';
import { useListParams } from '@/hooks/useListParams';
import { Cifra } from '../components/Cifra';
import { ItemsVista } from '../components/ItemsVista';
import { UnidadesVista } from '../components/UnidadesVista';
import { useResumenInventario } from '../hooks/useInventario';

export function BiomedicosPage() {
  const { extras, update } = useListParams(['vista', 'alerta'] as const);
  const { data: r } = useResumenInventario();
  const vista = extras.vista === 'tipos' ? 'tipos' : 'equipos';
  const e = r?.equipos;

  return (
    <>
      <PageHeader
        title="Biomédicos"
        description="Equipos biomédicos por placa: estado, sala, mantenimiento y calibración. Un equipo en mantenimiento, fuera de servicio o con la calibración vencida no se asigna a ningún procedimiento."
      />
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-3 2xl:grid-cols-5">
        <Cifra titulo="Equipos operativos" valor={e?.operativos} detalle={e ? `de ${e.total} registrados` : undefined} />
        <Cifra titulo="En mantenimiento o fuera de servicio" valor={e?.fuera_servicio} tono="warning" />
        <Cifra
          titulo="Calibración vencida"
          valor={e?.calibracion_vencida}
          detalle="No se usan para programar · ver vencidos"
          tono="danger"
          onClick={() => update({ vista: '', alerta: 'vencidos' })}
        />
        <Cifra
          titulo="Mantenimiento preventivo vencido"
          valor={e?.mantenimiento_vencido}
          detalle="Se siguen usando, con aviso"
          tono="warning"
          onClick={() => update({ vista: '', alerta: 'vencidos' })}
        />
        <Cifra
          titulo="Vencen en 30 días"
          valor={e ? e.mantenimiento_proximo + e.calibracion_proxima : undefined}
          detalle="Mantenimiento o calibración"
          tono="warning"
          onClick={() => update({ vista: '', alerta: 'mantenimiento' })}
        />
      </div>
      <FilterTabs
        aria-label="Vista"
        className="mb-4"
        value={vista}
        onChange={(v) => update({ vista: v === 'equipos' ? '' : v })}
        tabs={[
          { value: 'equipos', label: 'Equipos', count: e?.total },
          { value: 'tipos', label: 'Tipos de equipo' },
        ]}
      />
      {vista === 'equipos' ? <UnidadesVista tipo="EQUIPO" /> : <ItemsVista tipo="EQUIPO" />}
    </>
  );
}
