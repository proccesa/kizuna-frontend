import { FilterTabs, PageHeader } from '@/components/ui';
import { useListParams } from '@/hooks/useListParams';
import { Cifra } from '../components/Cifra';
import { InsumosVista } from '../components/InsumosVista';
import { ItemsVista } from '../components/ItemsVista';
import { UnidadesVista } from '../components/UnidadesVista';
import { useResumenInventario } from '../hooks/useInventario';

type Vista = 'insumos' | 'instrumental' | 'catalogo-insumos' | 'catalogo-instrumental';

export function CentralPage() {
  const { extras, update } = useListParams(['vista', 'filtro_insumo'] as const);
  const { data: r } = useResumenInventario();
  const vista = (['instrumental', 'catalogo-insumos', 'catalogo-instrumental'].includes(extras.vista) ? extras.vista : 'insumos') as Vista;

  return (
    <>
      <PageHeader
        title="Central"
        description="Insumos del almacén por sede y lote, y cajas de instrumental de la central de esterilización. Kizuna solo programa si alcanzan para el procedimiento."
      />
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Cifra titulo="Insumos bajo el mínimo" valor={r?.insumos.bajo_minimo} tono="danger" onClick={() => update({ vista: '', filtro_insumo: 'bajo_minimo' })} detalle="Ver cuáles" />
        <Cifra titulo="Insumos con lotes por vencer" valor={r?.insumos.por_vencer} tono="warning" onClick={() => update({ vista: '', filtro_insumo: 'por_vencer' })} detalle="Próximos 60 días" />
        <Cifra titulo="Insumos con lotes vencidos" valor={r?.insumos.vencidos} tono="danger" detalle="No cuentan como disponibles" />
        <Cifra titulo="Cajas de instrumental operativas" valor={r?.instrumental.operativas} detalle={r ? `de ${r.instrumental.total} registradas` : undefined} />
      </div>
      <FilterTabs
        aria-label="Vista"
        className="mb-4"
        value={vista}
        onChange={(v) => update({ vista: v === 'insumos' ? '' : v, filtro_insumo: '' })}
        tabs={[
          { value: 'insumos', label: 'Insumos' },
          { value: 'instrumental', label: 'Instrumental' },
          { value: 'catalogo-insumos', label: 'Catálogo de insumos' },
          { value: 'catalogo-instrumental', label: 'Tipos de caja' },
        ]}
      />
      {vista === 'insumos' && <InsumosVista />}
      {vista === 'instrumental' && <UnidadesVista tipo="INSTRUMENTAL" />}
      {vista === 'catalogo-insumos' && <ItemsVista tipo="INSUMO" />}
      {vista === 'catalogo-instrumental' && <ItemsVista tipo="INSTRUMENTAL" />}
    </>
  );
}
