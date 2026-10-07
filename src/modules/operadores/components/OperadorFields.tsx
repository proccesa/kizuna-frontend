import { useFormContext, type FieldError, type FieldValues } from 'react-hook-form';
import { Field, Input, Select } from '@/components/ui';
import { useTiposDocumento } from '@/modules/catalogos/hooks/useTiposDocumento';
import type { OperadorFieldsValues } from '../schema';

interface OperadorFieldsProps {
  /** Prefijo del grupo en el formulario padre, p. ej. "operador". */
  prefix?: string;
}

type Name = keyof OperadorFieldsValues;

/** Campos de datos personales del operador. Debe usarse dentro de un <FormProvider>. */
export function OperadorFields({ prefix }: OperadorFieldsProps) {
  const {
    register,
    formState: { errors },
  } = useFormContext<FieldValues>();
  const { data: tipos = [], isLoading } = useTiposDocumento();

  const path = (name: Name) => (prefix ? `${prefix}.${name}` : name);
  const group = (prefix ? errors[prefix] : errors) as Partial<Record<Name, FieldError>> | undefined;
  const error = (name: Name) => group?.[name]?.message;
  const id = (name: Name) => `op-${prefix ?? 'root'}-${name}`;

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label="Tipo de documento" htmlFor={id('tipo_documento_id')} error={error('tipo_documento_id')} required>
        <Select
          id={id('tipo_documento_id')}
          placeholder={isLoading ? 'Cargando…' : 'Selecciona'}
          options={tipos.map((t) => ({ value: t.id, label: `${t.codigo} · ${t.nombre}` }))}
          invalid={!!error('tipo_documento_id')}
          disabled={isLoading}
          {...register(path('tipo_documento_id'))}
        />
      </Field>
      <Field label="Número de documento" htmlFor={id('documento')} error={error('documento')} required>
        <Input id={id('documento')} inputMode="text" invalid={!!error('documento')} {...register(path('documento'))} />
      </Field>
      <Field label="Nombres" htmlFor={id('nombre')} error={error('nombre')} required>
        <Input id={id('nombre')} autoComplete="given-name" invalid={!!error('nombre')} {...register(path('nombre'))} />
      </Field>
      <Field label="Apellidos" htmlFor={id('apellido')} error={error('apellido')} required>
        <Input id={id('apellido')} autoComplete="family-name" invalid={!!error('apellido')} {...register(path('apellido'))} />
      </Field>
      <Field label="Teléfono" htmlFor={id('telefono')} error={error('telefono')}>
        <Input id={id('telefono')} type="tel" autoComplete="tel" invalid={!!error('telefono')} {...register(path('telefono'))} />
      </Field>
      <Field label="Dirección" htmlFor={id('direccion')} error={error('direccion')}>
        <Input id={id('direccion')} autoComplete="street-address" invalid={!!error('direccion')} {...register(path('direccion'))} />
      </Field>
    </div>
  );
}
