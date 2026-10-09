import { useEffect } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Field, Input, Modal, Switch } from '@/components/ui';
import { applyServerErrors } from '@/lib/forms';
import { DiasSelector } from '@/components/DiasSelector';
import { UbicacionSelect } from '@/modules/catalogos/components/UbicacionSelect';
import { useRedMutations } from '../hooks/useRed';
import { formToSedePayload, sedeSchema, sedeToForm, type SedeFormValues } from '../schema';
import type { Prestador, Sede } from '../types';

interface SedeModalProps {
  open: boolean;
  prestador: Prestador | null;
  /** Sede a editar; `null` para crear. */
  sede: Sede | null;
  onClose: () => void;
}

/** Siguiente número de sede libre: 01, 02… */
function siguienteNumero(prestador: Prestador | null) {
  const usados = new Set(prestador?.sedes?.map((s) => s.numero_sede));
  for (let n = 1; n < 100; n++) {
    const numero = String(n).padStart(2, '0');
    if (!usados.has(numero)) return numero;
  }
  return '';
}

export function SedeModal({ open, prestador, sede, onClose }: SedeModalProps) {
  const { crearSede, actualizarSede } = useRedMutations();
  const form = useForm<SedeFormValues>({ resolver: zodResolver(sedeSchema), defaultValues: sedeToForm(null) });
  const {
    register,
    control,
    formState: { errors, isSubmitting },
  } = form;

  useEffect(() => {
    if (open) form.reset(sedeToForm(sede, siguienteNumero(prestador)));
  }, [open, sede, prestador, form]);

  const departamentoId = useWatch({ control, name: 'departamento_id' });

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const payload = formToSedePayload(values);
      if (sede) await actualizarSede.mutateAsync({ id: sede.id, payload });
      else if (prestador) await crearSede.mutateAsync({ prestadorId: prestador.id, payload });
      onClose();
    } catch (error) {
      applyServerErrors(error, form.setError);
    }
  });

  const esPrimera = !sede && !prestador?.sedes?.length;

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      dismissible={!isSubmitting}
      title={sede ? `Editar ${sede.nombre}` : 'Nueva sede'}
      description={prestador?.nombre_comercial || prestador?.razon_social}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button type="submit" form="sede-form" isLoading={isSubmitting}>
            {sede ? 'Guardar cambios' : 'Crear sede'}
          </Button>
        </>
      }
    >
      <form id="sede-form" onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
        <div className="grid gap-4 sm:grid-cols-[7rem_1fr]">
          <Field label="N.º de sede" htmlFor="se-numero" error={errors.numero_sede?.message} required>
            <Input id="se-numero" inputMode="numeric" maxLength={2} invalid={!!errors.numero_sede} {...register('numero_sede')} />
          </Field>
          <Field label="Nombre" htmlFor="se-nombre" error={errors.nombre?.message} required>
            <Input id="se-nombre" placeholder="Sede Norte" invalid={!!errors.nombre} {...register('nombre')} />
          </Field>
        </div>

        <Controller
          control={control}
          name="municipio_id"
          render={({ field }) => (
            <UbicacionSelect
              idPrefix="se"
              required
              error={errors.municipio_id?.message}
              value={{ departamentoId, municipioId: field.value }}
              onChange={({ departamentoId, municipioId }) => {
                form.setValue('departamento_id', departamentoId);
                field.onChange(municipioId);
              }}
            />
          )}
        />

        <Field label="Dirección" htmlFor="se-direccion" error={errors.direccion?.message} required>
          <Input id="se-direccion" placeholder="Av. 6N # 28-40" invalid={!!errors.direccion} {...register('direccion')} />
        </Field>

        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Teléfono" htmlFor="se-tel" error={errors.telefono?.message}>
            <Input id="se-tel" type="tel" invalid={!!errors.telefono} {...register('telefono')} />
          </Field>
          <Field label="Correo" htmlFor="se-correo" error={errors.correo?.message}>
            <Input id="se-correo" type="email" invalid={!!errors.correo} {...register('correo')} />
          </Field>
          <Field label="Consultorios" htmlFor="se-consultorios" error={errors.consultorios?.message}>
            <Input id="se-consultorios" inputMode="numeric" invalid={!!errors.consultorios} {...register('consultorios')} />
          </Field>
        </div>

        <div className="rounded-2xl bg-cream p-4">
          <p className="text-sm font-semibold text-ink">Atención</p>
          <Controller
            control={control}
            name="dias_atencion"
            render={({ field }) => (
              <div className="mt-3">
                <DiasSelector aria-label="Días de atención" value={field.value} onChange={field.onChange} />
              </div>
            )}
          />
          {errors.dias_atencion?.message && <p className="mt-2 text-[0.8rem] font-medium text-danger">{errors.dias_atencion.message}</p>}
          <div className="mt-4 grid grid-cols-2 gap-4 sm:max-w-sm">
            <Field label="Abre" htmlFor="se-abre" error={errors.hora_apertura?.message} required>
              <Input id="se-abre" type="time" invalid={!!errors.hora_apertura} {...register('hora_apertura')} />
            </Field>
            <Field label="Cierra" htmlFor="se-cierra" error={errors.hora_cierre?.message} required>
              <Input id="se-cierra" type="time" invalid={!!errors.hora_cierre} {...register('hora_cierre')} />
            </Field>
          </div>
        </div>

        <div className="space-y-4">
          <Controller
            control={control}
            name="es_principal"
            render={({ field }) => (
              <Switch
                checked={esPrimera || field.value}
                onChange={field.onChange}
                disabled={esPrimera || sede?.es_principal}
                label="Sede principal"
                description={esPrimera ? 'La primera sede de un prestador siempre es la principal.' : 'Solo puede haber una por prestador.'}
              />
            )}
          />
          <Controller
            control={control}
            name="activo"
            render={({ field }) => (
              <Switch checked={field.value} onChange={field.onChange} label="Sede activa" description="Las sedes inactivas no reciben citas." />
            )}
          />
        </div>
      </form>
    </Modal>
  );
}
