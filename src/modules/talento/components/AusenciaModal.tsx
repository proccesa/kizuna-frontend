import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Field, Input, Modal, Select, Textarea } from '@/components/ui';
import { applyServerErrors } from '@/lib/forms';
import { useTalentoMutations } from '../hooks/useTalento';
import { ausenciaSchema, ausenciaVacia, formToAusenciaPayload, type AusenciaFormValues } from '../schema';
import { TIPOS_AUSENCIA, type Especialista } from '../types';

interface AusenciaModalProps {
  open: boolean;
  especialista: Especialista;
  onClose: () => void;
}

export function AusenciaModal({ open, especialista, onClose }: AusenciaModalProps) {
  const { crearAusencia } = useTalentoMutations();
  const form = useForm<AusenciaFormValues>({ resolver: zodResolver(ausenciaSchema), defaultValues: ausenciaVacia() });
  const {
    register,
    formState: { errors, isSubmitting },
  } = form;

  useEffect(() => {
    if (open) form.reset(ausenciaVacia());
  }, [open, form]);

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await crearAusencia.mutateAsync({ especialistaId: especialista.id, payload: formToAusenciaPayload(values) });
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
      title="Registrar novedad"
      description={`${especialista.nombre_completo} no atenderá en estas fechas.`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button type="submit" form="ausencia-form" isLoading={isSubmitting}>
            Registrar
          </Button>
        </>
      }
    >
      <form id="ausencia-form" onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
        <Field label="Tipo de novedad" htmlFor="au-tipo" error={errors.tipo?.message} required>
          <Select id="au-tipo" options={TIPOS_AUSENCIA} invalid={!!errors.tipo} {...register('tipo')} />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Desde" htmlFor="au-ini" error={errors.fecha_inicio?.message} required>
            <Input id="au-ini" type="date" invalid={!!errors.fecha_inicio} {...register('fecha_inicio')} />
          </Field>
          <Field label="Hasta" htmlFor="au-fin" error={errors.fecha_fin?.message} required>
            <Input id="au-fin" type="date" invalid={!!errors.fecha_fin} {...register('fecha_fin')} />
          </Field>
        </div>
        <Field label="Observación" htmlFor="au-obs" error={errors.observacion?.message}>
          <Textarea id="au-obs" rows={3} invalid={!!errors.observacion} {...register('observacion')} />
        </Field>
      </form>
    </Modal>
  );
}
