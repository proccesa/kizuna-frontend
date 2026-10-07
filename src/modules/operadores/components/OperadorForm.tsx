import { Controller, FormProvider, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, Switch } from '@/components/ui';
import { applyServerErrors } from '@/lib/forms';
import { useOperadorMutations } from '../hooks/useOperadores';
import { fieldsToOperadorPayload, operadorFieldsSchema, operadorToFields } from '../schema';
import type { Operador } from '../types';
import { OperadorFields } from './OperadorFields';

const schema = operadorFieldsSchema.extend({ activo: z.boolean() });
type FormValues = z.infer<typeof schema>;

interface OperadorFormProps {
  /** Operador a editar. `null` para crear. */
  operador: Operador | null;
  onCancel: () => void;
  onSaved: (operador: Operador) => void;
}

export function OperadorForm({ operador, onCancel, onSaved }: OperadorFormProps) {
  const { crear, actualizar } = useOperadorMutations();
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { ...operadorToFields(operador), activo: operador?.activo ?? true },
  });
  const isSubmitting = form.formState.isSubmitting;

  const onSubmit = form.handleSubmit(async (values) => {
    const payload = { ...fieldsToOperadorPayload(values), activo: values.activo };
    try {
      const response = operador ? await actualizar.mutateAsync({ id: operador.id, payload }) : await crear.mutateAsync(payload);
      onSaved(response.datos);
    } catch (error) {
      applyServerErrors(error, form.setError);
    }
  });

  return (
    <FormProvider {...form}>
      <form onSubmit={onSubmit} noValidate className="flex min-h-full flex-col">
        <div className="flex-1">
          <section className="px-6 py-6">
            <div className="mb-4 flex items-center gap-3">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-mist text-xs font-bold text-mist-ink">1</span>
              <h3 className="text-base font-bold">Datos personales</h3>
            </div>
            <OperadorFields />
          </section>
          <section className="border-t border-line px-6 py-6">
            <div className="mb-4 flex items-center gap-3">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-mist text-xs font-bold text-mist-ink">2</span>
              <h3 className="text-base font-bold">Estado</h3>
            </div>
            <Controller
              control={form.control}
              name="activo"
              render={({ field }) => (
                <Switch
                  checked={field.value}
                  onChange={field.onChange}
                  label="Operador activo"
                  description="Los operadores inactivos se conservan, pero no aparecen como disponibles."
                />
              )}
            />
          </section>
        </div>
        <div className="sticky bottom-0 flex flex-col-reverse gap-2 border-t border-line bg-surface/95 px-6 py-4 backdrop-blur sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={onCancel} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            {operador ? 'Guardar cambios' : 'Crear operador'}
          </Button>
        </div>
      </form>
    </FormProvider>
  );
}
