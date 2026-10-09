import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Field, Input, Select, Switch, Textarea } from '@/components/ui';
import { applyServerErrors } from '@/lib/forms';
import { useModalidadesContratacion, useRegimenes } from '@/modules/catalogos/hooks/useCatalogos';
import { SedesSelector } from '@/modules/red/components/SedesSelector';
import { useContratacionMutations, useEntidades } from '../hooks/useContratacion';
import { contratoSchema, contratoToForm, formatearValor, formToContratoPayload, type ContratoFormValues } from '../schema';
import type { Contrato } from '../types';

interface ContratoFormProps {
  contrato: Contrato | null;
  /** Entidad preseleccionada al crear (p. ej. desde el filtro). */
  entidadId?: number;
  onGuardado: (contrato: Contrato) => void;
  onCancelar: () => void;
}

export function ContratoForm({ contrato, entidadId, onGuardado, onCancelar }: ContratoFormProps) {
  const { crearContrato, actualizarContrato } = useContratacionMutations();
  const { data: entidades } = useEntidades({ activo: true, por_pagina: 100 });
  const { data: modalidades = [] } = useModalidadesContratacion();
  const { data: regimenes = [] } = useRegimenes();

  const form = useForm<ContratoFormValues>({
    resolver: zodResolver(contratoSchema),
    defaultValues: contratoToForm(contrato, entidadId),
  });
  const {
    register,
    control,
    formState: { errors, isSubmitting },
  } = form;

  useEffect(() => {
    form.reset(contratoToForm(contrato, entidadId));
  }, [contrato, entidadId, form]);

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const payload = formToContratoPayload(values);
      const respuesta = contrato ? await actualizarContrato.mutateAsync({ id: contrato.id, payload }) : await crearContrato.mutateAsync(payload);
      onGuardado(respuesta.datos);
    } catch (error) {
      applyServerErrors(error, form.setError);
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate className="flex min-h-full flex-col">
      <div className="flex-1 space-y-6 px-6 py-5">
        <section>
          <h3 className="mb-4 text-base font-bold">Contrato</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Entidad" htmlFor="co-entidad" error={errors.entidad_id?.message} required className="sm:col-span-2">
              <Controller
                control={control}
                name="entidad_id"
                render={({ field }) => (
                  <Select
                    id="co-entidad"
                    placeholder="Selecciona la entidad"
                    options={(entidades?.datos ?? []).map((e) => ({
                      value: e.id,
                      label: e.sigla ? `${e.razon_social} (${e.sigla})` : e.razon_social,
                    }))}
                    invalid={!!errors.entidad_id}
                    {...field}
                  />
                )}
              />
            </Field>
            <Field label="Número del contrato" htmlFor="co-numero" error={errors.numero?.message} required>
              <Input id="co-numero" placeholder="CT-2026-014" invalid={!!errors.numero} {...register('numero')} />
            </Field>
            <Field label="Modalidad" htmlFor="co-modalidad" error={errors.modalidad_contratacion_id?.message} required>
              <Controller
                control={control}
                name="modalidad_contratacion_id"
                render={({ field }) => (
                  <Select
                    id="co-modalidad"
                    placeholder="Selecciona"
                    options={modalidades.filter((m) => m.activo).map((m) => ({ value: m.id, label: m.nombre }))}
                    invalid={!!errors.modalidad_contratacion_id}
                    {...field}
                  />
                )}
              />
            </Field>
            <Field label="Régimen" htmlFor="co-regimen" error={errors.regimen_id?.message} required>
              <Controller
                control={control}
                name="regimen_id"
                render={({ field }) => (
                  <Select
                    id="co-regimen"
                    placeholder="Selecciona"
                    options={regimenes.filter((r) => r.activo).map((r) => ({ value: r.id, label: r.nombre }))}
                    invalid={!!errors.regimen_id}
                    {...field}
                  />
                )}
              />
            </Field>
            <Controller
              control={control}
              name="valor"
              render={({ field }) => (
                <Field label="Valor del contrato (COP)" htmlFor="co-valor" error={errors.valor?.message} hint="En PGP y cápita, el valor total de la vigencia.">
                  <div className="relative">
                    <span className="pointer-events-none absolute top-1/2 z-10 left-3.5 -translate-y-1/2 text-sm text-muted">$</span>
                    <Input
                      id="co-valor"
                      inputMode="numeric"
                      className="tabular pl-7"
                      value={field.value}
                      onChange={(e) => field.onChange(formatearValor(e.target.value))}
                      onBlur={field.onBlur}
                      invalid={!!errors.valor}
                    />
                  </div>
                </Field>
              )}
            />
            <Field label="Inicio" htmlFor="co-inicio" error={errors.fecha_inicio?.message} required>
              <Input id="co-inicio" type="date" invalid={!!errors.fecha_inicio} {...register('fecha_inicio')} />
            </Field>
            <Field label="Fin" htmlFor="co-fin" error={errors.fecha_fin?.message} required>
              <Input id="co-fin" type="date" invalid={!!errors.fecha_fin} {...register('fecha_fin')} />
            </Field>
            <Field label="Objeto" htmlFor="co-objeto" error={errors.objeto?.message} className="sm:col-span-2">
              <Textarea
                id="co-objeto"
                rows={2}
                placeholder="Prestación de servicios de consulta externa y apoyo diagnóstico…"
                invalid={!!errors.objeto}
                {...register('objeto')}
              />
            </Field>
          </div>
        </section>

        <section className="border-t border-line pt-6">
          <h3 className="text-base font-bold">Sedes donde se ejecuta</h3>
          <p className="mt-0.5 mb-3 text-sm text-muted">Kizuna programa a los pacientes de este contrato solo en estas sedes.</p>
          <Controller
            control={control}
            name="sede_ids"
            render={({ field }) => <SedesSelector value={field.value} onChange={field.onChange} error={errors.sede_ids?.message} />}
          />
        </section>

        <section className="border-t border-line pt-6">
          <Controller
            control={control}
            name="activo"
            render={({ field }) => (
              <Switch
                checked={field.value}
                onChange={field.onChange}
                label="Contrato activo"
                description="Desactívalo si se suspende; Kizuna deja de programar sus pacientes."
              />
            )}
          />
        </section>
      </div>

      <div className="sticky bottom-0 flex flex-col-reverse gap-2 border-t border-line bg-surface/95 px-6 py-4 backdrop-blur sm:flex-row sm:justify-end">
        <Button variant="secondary" onClick={onCancelar} disabled={isSubmitting}>
          Cancelar
        </Button>
        <Button type="submit" isLoading={isSubmitting}>
          {contrato ? 'Guardar cambios' : 'Crear contrato'}
        </Button>
      </div>
    </form>
  );
}
