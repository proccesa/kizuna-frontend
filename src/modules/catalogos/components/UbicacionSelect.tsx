import { Field, Select } from '@/components/ui';
import { useDepartamentos, useMunicipiosDe } from '../hooks/useCatalogos';

export interface Ubicacion {
  departamentoId: number | null;
  municipioId: number | null;
}

interface UbicacionSelectProps {
  value: Ubicacion;
  onChange: (value: Ubicacion) => void;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  idPrefix?: string;
}

/**
 * Selección encadenada departamento → municipio (DIVIPOLA).
 * Al cambiar de departamento se limpia el municipio.
 */
export function UbicacionSelect({ value, onChange, error, required, disabled, idPrefix = 'ubicacion' }: UbicacionSelectProps) {
  const { data: departamentos = [], isLoading: cargandoDeptos } = useDepartamentos();
  const { data: municipios = [], isFetching: cargandoMpios } = useMunicipiosDe(value.departamentoId);

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label="Departamento" htmlFor={`${idPrefix}-departamento`} required={required}>
        <Select
          id={`${idPrefix}-departamento`}
          value={value.departamentoId ?? ''}
          onChange={(e) => onChange({ departamentoId: e.target.value ? Number(e.target.value) : null, municipioId: null })}
          placeholder={cargandoDeptos ? 'Cargando…' : 'Selecciona'}
          options={departamentos.map((d) => ({ value: d.id, label: d.nombre }))}
          disabled={disabled || cargandoDeptos}
        />
      </Field>
      <Field label="Municipio" htmlFor={`${idPrefix}-municipio`} error={error} required={required}>
        <Select
          id={`${idPrefix}-municipio`}
          value={value.municipioId ?? ''}
          onChange={(e) => onChange({ ...value, municipioId: e.target.value ? Number(e.target.value) : null })}
          placeholder={!value.departamentoId ? 'Primero elige el departamento' : cargandoMpios ? 'Cargando…' : 'Selecciona'}
          options={municipios.map((m) => ({ value: m.id, label: m.nombre }))}
          invalid={!!error}
          disabled={disabled || !value.departamentoId || cargandoMpios}
        />
      </Field>
    </div>
  );
}
