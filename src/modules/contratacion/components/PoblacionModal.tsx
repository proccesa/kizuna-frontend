import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Field, Input, Modal, Select, Switch, Textarea } from '@/components/ui';
import { applyServerErrors } from '@/lib/forms';
import { useContratacionMutations, useContratos } from '../hooks/useContratacion';
import { formToPoblacionPayload, poblacionSchema, poblacionToForm, type PoblacionFormValues } from '../schema';
import type { Poblacion } from '../types';

interface PoblacionModalProps {
  open: boolean;
  /** Población a editar; `null` para crear. */
  poblacion: Poblacion | null;
  /** Contrato preseleccionado al crear. */
  contratoId?: number;
  onClose: () => void;
  onCreada?: (poblacion: Poblacion) => void;
}

export function PoblacionModal({ open, poblacion, contratoId, onClose, onCreada }: PoblacionModalProps) {
  const { crearPoblacion, actualizarPoblacion } = useContratacionMutations();
  const { data: contratos } = useContratos({ por_pagina: 100 }, open);
  const form = useForm<PoblacionFormValues>({
    resolver: zodResolver(poblacionSchema),
    defaultValues: poblacionToForm(null),
  });
  const {
    register,
    control,
    formState: { errors, isSubmitting },
  } = form;

  useEffect(() => {
    if (open) form.reset(poblacionToForm(poblacion, contratoId));
  }, [open, poblacion, contratoId, form]);

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const payload = formToPoblacionPayload(values);
      if (poblacion) await actualizarPoblacion.mutateAsync({ id: poblacion.id, payload });
      else onCreada?.((await crearPoblacion.mutateAsync(payload)).datos);
      onClose();
    } catch (error) {
      applyServerErrors(error, form.setError);
    }
  });

  return (
    <Modal
      open={open}
      onClose={onClose}
      dismissible={!isSubmitting}
      title={poblacion ? 'Editar población' : 'Nueva población'}
      description="Un grupo de pacientes de un contrato, por ejemplo «Afiliados contributivo Cali»."
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button type="submit" form="poblacion-form" isLoading={isSubmitting}>
            {poblacion ? 'Guardar cambios' : 'Crear población'}
          </Button>
        </>
      }
    >
      <form id="poblacion-form" onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
        <Field label="Contrato" htmlFor="po-contrato" error={errors.contrato_id?.message} required>
          <Controller
            control={control}
            name="contrato_id"
            render={({ field }) => (
              <Select
                id="po-contrato"
                placeholder="Selecciona el contrato"
                disabled={!!poblacion}
                options={(contratos?.datos ?? []).map((c) => ({
                  value: c.id,
                  label: `${c.numero} · ${c.entidad.sigla || c.entidad.razon_social} · ${c.modalidad.nombre}`,
                }))}
                invalid={!!errors.contrato_id}
                {...field}
              />
            )}
          />
        </Field>
        <Field label="Nombre" htmlFor="po-nombre" error={errors.nombre?.message} required>
          <Input id="po-nombre" placeholder="Afiliados contributivo Cali" invalid={!!errors.nombre} {...register('nombre')} />
        </Field>
        <Field label="Descripción" htmlFor="po-desc" error={errors.descripcion?.message}>
          <Textarea id="po-desc" rows={2} invalid={!!errors.descripcion} {...register('descripcion')} />
        </Field>
        <Controller
          control={control}
          name="activo"
          render={({ field }) => (
            <Switch
              checked={field.value}
              onChange={field.onChange}
              label="Población activa"
              description="Kizuna solo programa pacientes de poblaciones activas."
            />
          )}
        />
      </form>
    </Modal>
  );
}
