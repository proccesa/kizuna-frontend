import { useEffect, type ReactNode } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Drawer, Field, Input, Select, Switch } from '@/components/ui';
import { applyServerErrors } from '@/lib/forms';
import { calcularDigitoVerificacion } from '@/lib/nit';
import { useRedMutations } from '../hooks/useRed';
import { formToPrestadorPayload, prestadorSchema, prestadorToForm, type PrestadorFormValues } from '../schema';
import { NATURALEZAS, type Prestador } from '../types';

interface PrestadorDrawerProps {
  open: boolean;
  /** Prestador a editar; `null` para crear. */
  prestador: Prestador | null;
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

export function PrestadorDrawer({ open, prestador, onClose }: PrestadorDrawerProps) {
  const { crearPrestador, actualizarPrestador } = useRedMutations();
  const form = useForm<PrestadorFormValues>({ resolver: zodResolver(prestadorSchema), defaultValues: prestadorToForm(null) });
  const {
    register,
    control,
    setValue,
    formState: { errors, isSubmitting },
  } = form;

  useEffect(() => {
    if (open) form.reset(prestadorToForm(prestador));
  }, [open, prestador, form]);

  const nit = useWatch({ control, name: 'nit' });
  const dvSugerido = calcularDigitoVerificacion(nit ?? '');

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const payload = formToPrestadorPayload(values);
      if (prestador) await actualizarPrestador.mutateAsync({ id: prestador.id, payload });
      else await crearPrestador.mutateAsync(payload);
      onClose();
    } catch (error) {
      applyServerErrors(error, form.setError);
    }
  });

  return (
    <Drawer open={open} onClose={onClose} title={prestador ? 'Editar prestador' : 'Nuevo prestador'} dismissible={!isSubmitting} width="lg">
      <form onSubmit={onSubmit} noValidate className="flex min-h-full flex-col">
        <div className="flex-1">
          <Seccion titulo="Identificación">
            <div className="grid gap-4 sm:grid-cols-[1fr_7rem]">
              <Field label="NIT" htmlFor="pr-nit" error={errors.nit?.message} hint="Sin puntos ni dígito de verificación." required>
                <Input id="pr-nit" inputMode="numeric" autoComplete="off" invalid={!!errors.nit} {...register('nit')} />
              </Field>
              <Field
                label="DV"
                htmlFor="pr-dv"
                error={errors.digito_verificacion?.message}
                hint={dvSugerido !== null ? `Debería ser ${dvSugerido}` : undefined}
                required
              >
                <div className="relative">
                  <Input id="pr-dv" inputMode="numeric" maxLength={1} invalid={!!errors.digito_verificacion} {...register('digito_verificacion')} />
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
              <Field label="Razón social" htmlFor="pr-razon" error={errors.razon_social?.message} required className="sm:col-span-2">
                <Input id="pr-razon" invalid={!!errors.razon_social} {...register('razon_social')} />
              </Field>
              <Field label="Nombre comercial" htmlFor="pr-comercial" error={errors.nombre_comercial?.message} className="sm:col-span-2">
                <Input id="pr-comercial" invalid={!!errors.nombre_comercial} {...register('nombre_comercial')} />
              </Field>
              <Field label="Código de habilitación (REPS)" htmlFor="pr-reps" error={errors.codigo_habilitacion?.message}>
                <Input id="pr-reps" inputMode="numeric" invalid={!!errors.codigo_habilitacion} {...register('codigo_habilitacion')} />
              </Field>
              <Field label="Naturaleza" htmlFor="pr-naturaleza" error={errors.naturaleza?.message} required>
                <Select id="pr-naturaleza" options={NATURALEZAS} invalid={!!errors.naturaleza} {...register('naturaleza')} />
              </Field>
            </div>
          </Seccion>

          <Seccion titulo="Contacto">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Teléfono" htmlFor="pr-tel" error={errors.telefono?.message}>
                <Input id="pr-tel" type="tel" invalid={!!errors.telefono} {...register('telefono')} />
              </Field>
              <Field label="Correo" htmlFor="pr-correo" error={errors.correo?.message}>
                <Input id="pr-correo" type="email" invalid={!!errors.correo} {...register('correo')} />
              </Field>
              <Field label="Representante legal" htmlFor="pr-rep" error={errors.representante_legal?.message} className="sm:col-span-2">
                <Input id="pr-rep" invalid={!!errors.representante_legal} {...register('representante_legal')} />
              </Field>
            </div>
          </Seccion>

          <Seccion titulo="Estado">
            <Controller
              control={control}
              name="activo"
              render={({ field }) => (
                <Switch
                  checked={field.value}
                  onChange={field.onChange}
                  label="Prestador activo"
                  description="Kizuna solo programa citas en prestadores y sedes activos."
                />
              )}
            />
          </Seccion>
        </div>

        <div className="sticky bottom-0 flex flex-col-reverse gap-2 border-t border-line bg-surface/95 px-6 py-4 backdrop-blur sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            {prestador ? 'Guardar cambios' : 'Crear prestador'}
          </Button>
        </div>
      </form>
    </Drawer>
  );
}
