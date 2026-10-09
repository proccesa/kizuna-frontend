import { useEffect, type ReactNode } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Drawer, Field, Input, Select, Switch } from '@/components/ui';
import { cn } from '@/lib/cn';
import { applyServerErrors } from '@/lib/forms';
import { calcularDigitoVerificacion } from '@/lib/nit';
import { useRegimenes } from '@/modules/catalogos/hooks/useCatalogos';
import { useContratacionMutations } from '../hooks/useContratacion';
import { entidadSchema, entidadToForm, formToEntidadPayload, type EntidadFormValues } from '../schema';
import { TIPOS_ENTIDAD, type Entidad } from '../types';

interface EntidadDrawerProps {
  open: boolean;
  /** Entidad a editar; `null` para crear. */
  entidad: Entidad | null;
  onClose: () => void;
}

function Seccion({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section className="border-t border-line px-6 py-6 first:border-0">
      <h3 className="mb-4 text-base font-bold">{titulo}</h3>
      {children}
    </section>
  );
}

export function EntidadDrawer({ open, entidad, onClose }: EntidadDrawerProps) {
  const { crearEntidad, actualizarEntidad } = useContratacionMutations();
  const { data: regimenes = [] } = useRegimenes(open);
  const form = useForm<EntidadFormValues>({ resolver: zodResolver(entidadSchema), defaultValues: entidadToForm(null) });
  const {
    register,
    control,
    setValue,
    formState: { errors, isSubmitting },
  } = form;

  useEffect(() => {
    if (open) form.reset(entidadToForm(entidad));
  }, [open, entidad, form]);

  const nit = useWatch({ control, name: 'nit' });
  const dvSugerido = calcularDigitoVerificacion(nit ?? '');

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const payload = formToEntidadPayload(values);
      if (entidad) await actualizarEntidad.mutateAsync({ id: entidad.id, payload });
      else await crearEntidad.mutateAsync(payload);
      onClose();
    } catch (error) {
      applyServerErrors(error, form.setError);
    }
  });

  return (
    <Drawer open={open} onClose={onClose} title={entidad ? 'Editar entidad' : 'Nueva entidad'} dismissible={!isSubmitting} width="lg">
      <form onSubmit={onSubmit} noValidate className="flex min-h-full flex-col">
        <div className="flex-1">
          <Seccion titulo="Identificación">
            <div className="grid gap-4 sm:grid-cols-[1fr_7rem]">
              <Field label="NIT" htmlFor="en-nit" error={errors.nit?.message} hint="Sin puntos ni dígito de verificación." required>
                <Input id="en-nit" inputMode="numeric" autoComplete="off" invalid={!!errors.nit} {...register('nit')} />
              </Field>
              <Field label="DV" htmlFor="en-dv" error={errors.digito_verificacion?.message} hint={dvSugerido !== null ? `Debería ser ${dvSugerido}` : undefined} required>
                <div className="relative">
                  <Input id="en-dv" inputMode="numeric" maxLength={1} invalid={!!errors.digito_verificacion} {...register('digito_verificacion')} />
                  {dvSugerido !== null && (
                    <button
                      type="button"
                      onClick={() => setValue('digito_verificacion', String(dvSugerido), { shouldValidate: true })}
                      className="absolute top-1/2 right-2 -translate-y-1/2 cursor-pointer rounded-md px-1.5 text-xs font-semibold text-mint-ink hover:bg-mint-soft"
                    >
                      Usar
                    </button>
                  )}
                </div>
              </Field>
              <Field label="Razón social" htmlFor="en-razon" error={errors.razon_social?.message} required className="sm:col-span-2">
                <Input id="en-razon" placeholder="Nueva EPS S.A." invalid={!!errors.razon_social} {...register('razon_social')} />
              </Field>
              <Field label="Sigla o nombre corto" htmlFor="en-sigla" error={errors.sigla?.message} hint="Se muestra en agendas y tarjetas.">
                <Input id="en-sigla" placeholder="NEPS" invalid={!!errors.sigla} {...register('sigla')} />
              </Field>
              <Field label="Código MinSalud" htmlFor="en-cod" error={errors.codigo_minsalud?.message} hint="Ej. EPS037">
                <Input id="en-cod" className="uppercase" invalid={!!errors.codigo_minsalud} {...register('codigo_minsalud')} />
              </Field>
              <Field label="Tipo" htmlFor="en-tipo" error={errors.tipo?.message} required className="sm:col-span-2">
                <Select id="en-tipo" options={TIPOS_ENTIDAD} invalid={!!errors.tipo} {...register('tipo')} />
              </Field>
            </div>
          </Seccion>

          <Seccion titulo="Regímenes que atiende">
            <Controller
              control={control}
              name="regimen_ids"
              render={({ field }) => (
                <div className="flex flex-wrap gap-1.5" role="group" aria-label="Regímenes">
                  {regimenes.map((r) => {
                    const marcado = field.value.includes(r.id);
                    return (
                      <button
                        key={r.id}
                        type="button"
                        aria-pressed={marcado}
                        onClick={() => field.onChange(marcado ? field.value.filter((x) => x !== r.id) : [...field.value, r.id])}
                        className={cn(
                          'cursor-pointer rounded-xl px-3.5 py-2 text-sm font-medium transition-colors',
                          marcado ? 'bg-petrol text-white' : 'border border-line-strong bg-surface text-body hover:bg-sand',
                        )}
                      >
                        {r.nombre}
                      </button>
                    );
                  })}
                </div>
              )}
            />
          </Seccion>

          <Seccion titulo="Contacto">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Teléfono" htmlFor="en-tel" error={errors.telefono?.message}>
                <Input id="en-tel" type="tel" invalid={!!errors.telefono} {...register('telefono')} />
              </Field>
              <Field label="Correo" htmlFor="en-correo" error={errors.correo?.message}>
                <Input id="en-correo" type="email" invalid={!!errors.correo} {...register('correo')} />
              </Field>
            </div>
          </Seccion>

          <Seccion titulo="Estado">
            <Controller
              control={control}
              name="activo"
              render={({ field }) => (
                <Switch checked={field.value} onChange={field.onChange} label="Entidad activa" description="Kizuna no programa pacientes de entidades inactivas." />
              )}
            />
          </Seccion>
        </div>

        <div className="sticky bottom-0 flex flex-col-reverse gap-2 border-t border-line bg-surface/95 px-6 py-4 backdrop-blur sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            {entidad ? 'Guardar cambios' : 'Crear entidad'}
          </Button>
        </div>
      </form>
    </Drawer>
  );
}
