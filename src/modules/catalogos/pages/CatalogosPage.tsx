import { useMemo, useState } from 'react';
import { MapPin } from 'lucide-react';
import { Badge, Card, EmptyState, FilterTabs, PageHeader, Pagination, SearchInput, Select, Skeleton } from '@/components/ui';
import { cn } from '@/lib/cn';
import { formatNumber } from '@/lib/format';
import { useAuth } from '@/modules/auth/hooks/useAuth';
import { PERMISOS } from '@/modules/auth/permisos';
import { useBuscarCups, useBuscarMunicipios, useDepartamentos, useModalidadesContratacion, useMunicipiosDe, useRegimenes } from '../hooks/useCatalogos';
import { useTiposDocumento } from '../hooks/useTiposDocumento';
import type { CatalogoSimple, Municipio } from '../types';

type Pestana = 'divipola' | 'cups' | 'regimenes' | 'modalidades' | 'documentos';

/** Normaliza para comparar sin tildes ni mayúsculas. */
const normalizar = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

function ListaCatalogo({ items, isLoading }: { items: CatalogoSimple[]; isLoading: boolean }) {
  const [filtro, setFiltro] = useState('');
  const [pagina, setPagina] = useState(1);
  const porPagina = 10;

  const filtrados = useMemo(() => {
    if (!filtro.trim()) return items;
    const q = normalizar(filtro.trim());
    return items.filter(
      (item) => normalizar(item.nombre).includes(q) || item.codigo.toLowerCase().includes(q) || (item.descripcion && normalizar(item.descripcion).includes(q)),
    );
  }, [items, filtro]);

  if (isLoading) return <Skeleton className="m-5 h-40" />;

  const total = filtrados.length;
  const totalPaginas = Math.ceil(total / porPagina);
  const inicio = (pagina - 1) * porPagina;
  const paginaItems = filtrados.slice(inicio, inicio + porPagina);

  return (
    <div>
      <div className="flex flex-col gap-2 border-b border-line p-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="tabular text-xs text-muted">
          {total} {total === 1 ? 'registro' : 'registros'}
        </p>
        <SearchInput
          value={filtro}
          onChange={(v) => {
            setFiltro(v);
            setPagina(1);
          }}
          placeholder="Buscar en el catálogo…"
          className="sm:w-64"
        />
      </div>

      {paginaItems.length === 0 ? (
        <EmptyState title="Sin coincidencias" description={`No hay registros que coincidan con "${filtro}".`} />
      ) : (
        <>
          <ul className="divide-y divide-line">
            {paginaItems.map((item) => (
              <li key={item.id} className="flex flex-col gap-1 px-5 py-4 sm:flex-row sm:items-start sm:gap-6">
                <span className="w-36 shrink-0">
                  <Badge tone="mist" className="tabular">
                    {item.codigo}
                  </Badge>
                </span>
                <span>
                  <span className="block font-semibold text-ink">{item.nombre}</span>
                  {item.descripcion && <span className="block text-sm text-muted">{item.descripcion}</span>}
                </span>
              </li>
            ))}
          </ul>

          {total > porPagina && (
            <Pagination
              paginacion={{
                total,
                por_pagina: porPagina,
                pagina_actual: pagina,
                total_paginas: totalPaginas,
                desde: inicio + 1,
                hasta: Math.min(inicio + porPagina, total),
              }}
              onPageChange={setPagina}
            />
          )}
        </>
      )}
    </div>
  );
}

function FilaMunicipio({ municipio, conDepartamento }: { municipio: Municipio; conDepartamento?: boolean }) {
  return (
    <li className="flex items-center justify-between gap-3 px-5 py-2.5">
      <span className="min-w-0">
        <span className="block truncate font-medium text-ink">{municipio.nombre}</span>
        {conDepartamento && <span className="block text-xs text-muted">{municipio.departamento?.nombre}</span>}
      </span>
      <span className="flex shrink-0 items-center gap-2">
        {municipio.tipo !== 'Municipio' && <Badge tone="lime">{municipio.tipo}</Badge>}
        <span className="tabular text-sm text-muted">{municipio.codigo}</span>
      </span>
    </li>
  );
}

function Divipola() {
  const { data: departamentos = [], isLoading } = useDepartamentos();
  const [seleccionado, setSeleccionado] = useState<number | null>(null);
  const [filtroDepto, setFiltroDepto] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [paginaPais, setPaginaPais] = useState(1);

  const departamentoActivo = seleccionado ?? departamentos[0]?.id ?? null;
  const { data: municipios = [], isFetching } = useMunicipiosDe(departamentoActivo);
  const buscandoPais = busqueda.trim().length >= 2;
  const resultados = useBuscarMunicipios({ buscar: busqueda.trim(), pagina: paginaPais, por_pagina: 20 }, buscandoPais);

  const deptosFiltrados = useMemo(
    () => departamentos.filter((d) => !filtroDepto || normalizar(d.nombre).includes(normalizar(filtroDepto)) || d.codigo.startsWith(filtroDepto)),
    [departamentos, filtroDepto],
  );
  const totalMunicipios = departamentos.reduce((s, d) => s + (d.municipios_count ?? 0), 0);
  const depto = departamentos.find((d) => d.id === departamentoActivo);

  return (
    <div className="grid min-h-[32rem] lg:grid-cols-[19rem_1fr]">
      {/* Departamentos */}
      <div className="border-b border-line lg:border-r lg:border-b-0">
        <div className="border-b border-line p-4">
          <SearchInput value={filtroDepto} onChange={setFiltroDepto} placeholder="Filtrar departamentos" debounce={0} />
          <p className="tabular mt-2 text-xs text-muted">
            {departamentos.length} departamentos · {formatNumber(totalMunicipios)} municipios
          </p>
        </div>
        {isLoading ? (
          <Skeleton className="m-4 h-64" />
        ) : (
          <ul className="max-h-[28rem] overflow-y-auto p-2">
            {deptosFiltrados.map((d) => (
              <li key={d.id}>
                <button
                  type="button"
                  onClick={() => {
                    setSeleccionado(d.id);
                    setBusqueda('');
                    setPaginaPais(1);
                  }}
                  className={cn(
                    'flex w-full cursor-pointer items-center justify-between gap-2 rounded-xl px-3 py-2 text-left text-sm transition-colors',
                    d.id === departamentoActivo && !buscandoPais ? 'bg-mist font-semibold text-mist-ink' : 'text-body hover:bg-sand',
                  )}
                >
                  <span className="truncate">{d.nombre}</span>
                  <span className="tabular shrink-0 text-xs text-muted">{d.municipios_count}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Municipios */}
      <div className="min-w-0 flex flex-col justify-between">
        <div>
          <div className="flex flex-col gap-3 border-b border-line p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-bold">{buscandoPais ? 'Resultados en todo el país' : depto?.nombre}</h2>
              <p className="tabular text-xs text-muted">
                {buscandoPais
                  ? `${resultados.data?.paginacion.total ?? '…'} municipios coinciden`
                  : depto && `Código DANE ${depto.codigo} · ${depto.municipios_count} municipios`}
              </p>
            </div>
            <SearchInput
              value={busqueda}
              onChange={(v) => {
                setBusqueda(v);
                setPaginaPais(1);
              }}
              placeholder="Buscar municipio en todo el país"
              className="sm:w-72"
            />
          </div>

          {buscandoPais ? (
            resultados.data && resultados.data.datos.length === 0 ? (
              <EmptyState title="Sin coincidencias" description={`No hay municipios que coincidan con "${busqueda}".`} />
            ) : (
              <ul className={cn('divide-y divide-line', resultados.isFetching && 'opacity-60')}>
                {(resultados.data?.datos ?? []).map((m) => (
                  <FilaMunicipio key={m.id} municipio={m} conDepartamento />
                ))}
              </ul>
            )
          ) : (
            <ul className={cn('grid divide-y divide-line sm:grid-cols-2 sm:divide-y-0', isFetching && 'opacity-60')}>
              {municipios.map((m) => (
                <FilaMunicipio key={m.id} municipio={m} />
              ))}
            </ul>
          )}
        </div>

        {buscandoPais && resultados.data && resultados.data.paginacion.total_paginas > 1 && (
          <Pagination
            paginacion={resultados.data.paginacion}
            onPageChange={setPaginaPais}
            disabled={resultados.isFetching}
          />
        )}
      </div>
    </div>
  );
}

function CatalogoCups() {
  const [buscar, setBuscar] = useState('');
  const [habilitado, setHabilitado] = useState<'1' | '0' | 'todos'>('1');
  const [pagina, setPagina] = useState(1);
  const [porPagina, setPorPagina] = useState(25);

  const { data, isLoading, isFetching } = useBuscarCups({
    buscar: buscar.trim() || undefined,
    habilitado,
    pagina,
    por_pagina: porPagina,
  });

  return (
    <>
      <div className="flex flex-col gap-3 border-b border-line p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-muted">
            Catálogo oficial del Ministerio de Salud (tabla CUPSRips de SISPRO)
          </p>
          <p className="tabular text-xs text-muted mt-0.5">
            Total:{' '}
            <span className="font-semibold text-ink">
              {data ? formatNumber(data.paginacion.total) : '…'}
            </span>{' '}
            procedimientos registrados
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Select
            aria-label="Cantidad por página"
            value={String(porPagina)}
            onChange={(e) => {
              setPorPagina(Number(e.target.value));
              setPagina(1);
            }}
            options={[
              { value: '25', label: '25 por pág.' },
              { value: '50', label: '50 por pág.' },
              { value: '100', label: '100 por pág.' },
            ]}
            className="h-10 w-32"
          />
          <Select
            aria-label="Habilitación"
            value={habilitado}
            onChange={(e) => {
              setHabilitado(e.target.value as '1' | '0' | 'todos');
              setPagina(1);
            }}
            options={[
              { value: '1', label: 'Habilitados' },
              { value: '0', label: 'No habilitados' },
              { value: 'todos', label: 'Todos' },
            ]}
            className="h-10 w-36"
          />
          <SearchInput
            value={buscar}
            onChange={(v) => {
              setBuscar(v);
              setPagina(1);
            }}
            placeholder="Código o palabras del nombre"
            className="w-full sm:w-64"
          />
        </div>
      </div>

      {isLoading ? (
        <Skeleton className="m-5 h-64" />
      ) : !data?.datos.length ? (
        <EmptyState
          title="Sin coincidencias"
          description="Prueba con un código (890201) o palabras del nombre (consulta pediatria)."
        />
      ) : (
        <>
          <ul className={cn('divide-y divide-line', isFetching && 'opacity-60')}>
            {data.datos.map((c) => (
              <li key={c.id} className="flex items-start gap-4 px-5 py-3 hover:bg-sand/30 transition-colors">
                <span className="tabular w-20 shrink-0 font-display font-bold text-ink">{c.codigo}</span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium text-ink">{c.nombre}</span>
                  {c.seccion && (
                    <span className="block text-xs text-muted">{c.seccion.replace(/^ANEXO TECNICO \d+ - /, '')}</span>
                  )}
                  {c.especialidades && c.especialidades.length > 0 && (
                    <span className="mt-1 flex flex-wrap gap-1">
                      {c.especialidades.map((esp) => (
                        <span key={esp.id} className="inline-block text-[0.7rem] bg-sand px-1.5 py-0.5 rounded text-body font-medium">
                          {esp.nombre}
                        </span>
                      ))}
                    </span>
                  )}
                </span>
                <span className="flex shrink-0 gap-1.5 items-center">
                  {c.es_quirurgico && <Badge tone="lime">Quirúrgico</Badge>}
                  {!c.habilitado && <Badge tone="warning">No habilitado</Badge>}
                </span>
              </li>
            ))}
          </ul>
          <Pagination paginacion={data.paginacion} onPageChange={setPagina} disabled={isFetching} />
        </>
      )}
    </>
  );
}

export function CatalogosPage() {
  const { can } = useAuth();
  const [pestana, setPestana] = useState<Pestana>('divipola');
  const regimenes = useRegimenes(pestana === 'regimenes');
  const modalidades = useModalidadesContratacion(pestana === 'modalidades');
  const verDocumentos = can(PERMISOS.tiposDocumento.listar);
  const documentos = useTiposDocumento(pestana === 'documentos' && verDocumentos);

  return (
    <>
      <PageHeader
        title="Catálogos"
        description="Datos de referencia que usan los demás módulos: la DIVIPOLA del DANE, el catálogo CUPS del MinSalud, regímenes, modalidades de contratación y tipos de documento."
      />

      <Card className="animate-enter overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line p-4">
          <FilterTabs
            aria-label="Catálogo"
            value={pestana}
            onChange={setPestana}
            tabs={[
              { value: 'divipola', label: 'Departamentos y municipios' },
              { value: 'cups', label: 'CUPS' },
              { value: 'regimenes', label: 'Regímenes' },
              { value: 'modalidades', label: 'Modalidades de contratación' },
              ...(verDocumentos ? [{ value: 'documentos' as const, label: 'Tipos de documento' }] : []),
            ]}
          />
          {pestana === 'divipola' && (
            <span className="flex items-center gap-1.5 text-xs text-muted">
              <MapPin className="size-3.5" aria-hidden /> Fuente: DANE, DIVIPOLA
            </span>
          )}
        </div>

        {pestana === 'divipola' && <Divipola />}
        {pestana === 'cups' && <CatalogoCups />}
        {pestana === 'regimenes' && <ListaCatalogo items={regimenes.data ?? []} isLoading={regimenes.isLoading} />}
        {pestana === 'modalidades' && <ListaCatalogo items={modalidades.data ?? []} isLoading={modalidades.isLoading} />}
        {pestana === 'documentos' && (
          <ListaCatalogo items={(documentos.data ?? []).map((d) => ({ ...d }))} isLoading={documentos.isLoading} />
        )}
      </Card>
    </>
  );
}

