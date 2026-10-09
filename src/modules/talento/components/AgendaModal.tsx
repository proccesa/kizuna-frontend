import { useEffect, useMemo } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { DiasSelector } from '@/components/DiasSelector';
import { Button, Field, Input, Modal, Select, Switch } from '@/components/ui';
import { applyServerErrors } from '@/lib/forms';
import { formatearDias } from '@/lib/horario';
import { useSedes } from '@/modules/red/hooks/useRed';
import { useTalentoMutations } from '../hooks/useTalento';
import { agendaSchema, agendaToForm, formToAgendaPayload, type AgendaFormValues } from '../schema';
import type { Agenda, Especialista } from '../types';

interface AgendaModalProps {
  open: boolean;
  especialista: Especialista;
  /** Franja a editar; `null` para crear. */
  agenda: Agenda | null;
  onClose: () => void;
}

const minutos = (h: string) => {
  const [hh, mm] = h.split(':').map(Number);
  return (hh ?? 0) * 60 + (mm ?? 0);
};

export function AgendaModal({ open, especialista, agenda, onClose }: AgendaModalProps) {
  const { crearAgenda, actualizarAgenda } = useTalentoMutations();
  const { data: sedesData } = useSedes({ por_pagina: 100, activo: true }, open);
  const sedes = useMemo(() => sedesData?.datos ?? [], [sedesData]);

  const form = useForm<AgendaFormValues>({
    resolver: zodResolver(agendaSchema),
    defaultValues: agendaToForm(null),
  });
  const {
    register,
    control,
    formState: { errors, isSubmitting },
  } = form;

  useEffect(() => {
    if (open) form.reset(agendaToForm(agenda, especialista.especialidades.length === 1 ? especialista.especialidades[0]!.id : undefined));
  }, [open, agenda, especialista, form]);

  const [sedeId, dias, inicio, fin] = useWatch({
    control,
    name: ['sede_id', 'dias', 'hora_inicio', 'hora_fin'],
  });
  const sede = sedes.find((s) => String(s.id) === sedeId);

  // Al elegir la sede, la franja se ajusta a sus días y horario.
  useEffect(() => {
    if (!sede || agenda) return;
    form.setValue(
      'dias',
      dias.filter((d) => sede.dias_atencion.includes(d)),
    );
    if (inicio < sede.hora_apertura) form.setValue('hora_inicio', sede.hora_apertura);
    if (fin > sede.hora_cierre) form.setValue('hora_fin', sede.hora_cierre);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sede?.id]);

  const horasSemana = fin > inicio ? ((minutos(fin) - minutos(inicio)) * dias.length) / 60 : 0;

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const payload = formToAgendaPayload(values);
      if (agenda) await actualizarAgenda.mutateAsync({ id: agenda.id, payload });
      else
        await crearAgenda.mutateAsync({
          especialistaId: especialista.id,
          payload,
        });
      onClose();
    } catch (error) {
      applyServerErrors(error, form.setError);
    }
  });

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      dismissible={!isSubmitting}
      title={agenda ? 'Editar franja' : 'Nueva franja de agenda'}
      description={especialista.nombre_completo}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button type="submit" form="agenda-form" isLoading={isSubmitting}>
            {agenda ? 'Guardar cambios' : 'Agregar franja'}
          </Button>
        </>
      }
    >
      <form id="agenda-form" onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Sede" htmlFor="ag-sede" error={errors.sede_id?.message} required>
            <Controller
              control={control}
              name="sede_id"
              render={({ field }) => (
                <Select
                  id="ag-sede"
                  placeholder="Selecciona la sede"
                  options={sedes.map((s) => ({
                    value: s.id,
                    label: `${s.nombre} · ${s.prestador?.nombre_comercial || s.prestador?.razon_social}`,
                  }))}
                  invalid={!!errors.sede_id}
                  {...field}
                />
              )}
            />
          </Field>
          <Field label="Especialidad" htmlFor="ag-esp" error={errors.especialidad_id?.message} required>
            <Controller
              control={control}
              name="especialidad_id"
              render={({ field }) => (
                <Select
                  id="ag-esp"
                  placeholder="Selecciona"
                  options={especialista.especialidades.map((e) => ({
                    value: e.id,
                    label: e.nombre,
                  }))}
                  invalid={!!errors.especialidad_id}
                  {...field}
                />
              )}
            />
          </Field>
        </div>

        <div className="rounded-2xl bg-cream p-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="text-sm font-semibold text-ink">Días y horario</p>
            {sede && (
              <p className="text-xs text-muted">
                La sede atiende {formatearDias(sede.dias_atencion)} de {sede.hora_apertura} a {sede.hora_cierre}
              </p>
            )}
          </div>
          <div className="mt-3">
            <Controller
              control={control}
              name="dias"
              render={({ field }) => (
                <DiasSelector aria-label="Días de la franja" value={field.value} onChange={field.onChange} permitidos={sede?.dias_atencion} />
              )}
            />
          </div>
          {errors.dias?.message && <p className="mt-2 text-[0.8rem] font-medium text-danger">{errors.dias.message}</p>}
          <div className="mt-4 grid grid-cols-2 gap-4 sm:max-w-sm">
            <Field label="Desde" htmlFor="ag-ini" error={errors.hora_inicio?.message} required>
              <Input
                id="ag-ini"
                type="time"
                step={300}
                min={sede?.hora_apertura}
                max={sede?.hora_cierre}
                invalid={!!errors.hora_inicio}
                {...register('hora_inicio')}
              />
            </Field>
            <Field label="Hasta" htmlFor="ag-fin" error={errors.hora_fin?.message} required>
              <Input
                id="ag-fin"
                type="time"
                step={300}
                min={sede?.hora_apertura}
                max={sede?.hora_cierre}
                invalid={!!errors.hora_fin}
                {...register('hora_fin')}
              />
            </Field>
          </div>
          <p className="tabular mt-3 text-sm text-body">
            <span className="font-display text-lg font-bold text-ink">
              {horasSemana.toLocaleString('es-CO', {
                maximumFractionDigits: 1,
              })}{' '}
              h
            </span>{' '}
            de agenda por semana
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Vigente desde" htmlFor="ag-desde" error={errors.vigente_desde?.message} required>
            <Input id="ag-desde" type="date" invalid={!!errors.vigente_desde} {...register('vigente_desde')} />
          </Field>
          <Field label="Hasta" htmlFor="ag-hasta" error={errors.vigente_hasta?.message} hint="Vacío: sin fecha de fin.">
            <Input id="ag-hasta" type="date" invalid={!!errors.vigente_hasta} {...register('vigente_hasta')} />
          </Field>
          <Field label="Consultorio" htmlFor="ag-cons" error={errors.consultorio?.message}>
            <Input id="ag-cons" placeholder="204" invalid={!!errors.consultorio} {...register('consultorio')} />
          </Field>
        </div>

        <Controller
          control={control}
          name="activo"
          render={({ field }) => (
            <Switch
              checked={field.value}
              onChange={field.onChange}
              label="Franja activa"
              description="Las franjas inactivas se conservan, pero Kizuna no programa en ellas."
            />
          )}
        />
      </form>
    </Modal>
  );
}
