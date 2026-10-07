import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, Field, Input, Modal, Textarea } from '@/components/ui';
import { applyServerErrors, emptyToNull } from '@/lib/forms';
import { useServiciosMutations } from '../hooks/useServicios';
import type { Especialidad } from '../types';

const schema = z.object({
  nombre: z.string().trim().min(1, 'El nombre es obligatorio.').max(150, 'Máximo 150 caracteres.'),
  descripcion: z.string().trim().max(255, 'Máximo 255 caracteres.'),
});
type Valores = z.infer<typeof schema>;

export function EspecialidadModal({ open, especialidad, onClose }: { open: boolean; especialidad: Especialidad | null; onClose: () => void }) {
  const { crearEspecialidad, actualizarEspecialidad } = useServiciosMutations();
  const form = useForm<Valores>({ resolver: zodResolver(schema), defaultValues: { nombre: '', descripcion: '' } });
  const { register, formState } = form;

  useEffect(() => {
    if (open) form.reset({ nombre: especialidad?.nombre ?? '', descripcion: especialidad?.descripcion ?? '' });
  }, [open, especialidad, form]);

  const guardar = form.handleSubmit(async (v) => {
    const payload = { nombre: v.nombre.trim(), descripcion: emptyToNull(v.descripcion) };
    try {
      if (especialidad) await actualizarEspecialidad.mutateAsync({ id: especialidad.id, payload });
      else await crearEspecialidad.mutateAsync(payload);
      onClose();
    } catch (error) {
      applyServerErrors(error, form.setError);
    }
  });

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="sm"
      dismissible={!formState.isSubmitting}
      title={especialidad ? 'Editar especialidad' : 'Nueva especialidad'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={formState.isSubmitting}>
            Cancelar
          </Button>
          <Button type="submit" form="especialidad-form" isLoading={formState.isSubmitting}>
            {especialidad ? 'Guardar' : 'Crear'}
          </Button>
        </>
      }
    >
      <form id="especialidad-form" onSubmit={guardar} noValidate className="flex flex-col gap-4">
        <Field label="Nombre" htmlFor="esp-nombre" error={formState.errors.nombre?.message} required>
          <Input id="esp-nombre" invalid={!!formState.errors.nombre} {...register('nombre')} />
        </Field>
        <Field label="Descripción" htmlFor="esp-desc" error={formState.errors.descripcion?.message}>
          <Textarea id="esp-desc" rows={3} invalid={!!formState.errors.descripcion} {...register('descripcion')} />
        </Field>
      </form>
    </Modal>
  );
}
