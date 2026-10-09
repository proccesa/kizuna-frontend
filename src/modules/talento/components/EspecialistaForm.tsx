import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X } from 'lucide-react';
import { Button, Field, Input, Select, Switch } from '@/components/ui';
import { applyServerErrors } from '@/lib/forms';
import { useTiposDocumento } from '@/modules/catalogos/hooks/useTiposDocumento';
import { EspecialidadesPicker } from '@/modules/servicios/components/EspecialidadesPicker';
import { useEspecialidades } from '@/modules/servicios/hooks/useServicios';
import { useAuth } from '@/modules/auth/hooks/useAuth';
import { PERMISOS } from '@/modules/auth/permisos';
import { useUsuarios } from '@/modules/usuarios/hooks/useUsuarios';
import { useTalentoMutations } from '../hooks/useTalento';
import { especialistaSchema, especialistaToForm, formToEspecialistaPayload, type EspecialistaFormInput, type EspecialistaFormValues } from '../schema';
import type { Especialista } from '../types';

interface EspecialistaFormProps {
  /** Especialista a editar; `null` para crear. */
  especialista: Especialista | null;
  onGuardado: (especialista: Especialista) => void;
  onCancelar: () => void;
}

export function EspecialistaForm({ especialista, onGuardado, onCancelar }: EspecialistaFormProps) {
  const { crearEspecialista, actualizarEspecialista } = useTalentoMutations();
  const { data: tipos = [] } = useTiposDocumento();
  const { data: especialidades = [] } = useEspecialidades();
  const tipoCC = tipos.find((t) => t.codigo === 'CC');
  const { can } = useAuth();
  const { data: usuarios } = useUsuarios({ por_pagina: 100, activo: true }, can(PERMISOS.usuarios.listar));

  const form = useForm<EspecialistaFormInput, unknown, EspecialistaFormValues>({
    resolver: zodResolver(especialistaSchema),
    defaultValues: especialistaToForm(especialista),
  });
  const {
    register,
    control,
    formState: { errors, isSubmitting },
  } = form;

  useEffect(() => {
    form.reset(especialistaToForm(especialista));
  }, [especialista, form]);

  // Cédula de ciudadanía por defecto al crear.
  useEffect(() => {
    if (!especialista && tipoCC && !form.getValues('tipo_documento_id')) form.setValue('tipo_documento_id', String(tipoCC.id));
  }, [especialista, tipoCC, form]);

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const payload = formToEspecialistaPayload(values);
      const respuesta = especialista
        ? await actualizarEspecialista.mutateAsync({
            id: especialista.id,
            payload,
          })
        : await crearEspecialista.mutateAsync(payload);
      onGuardado(respuesta.datos);
    } catch (error) {
      applyServerErrors(error, form.setError);
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate className="flex min-h-full flex-col">
      <div className="flex-1 space-y-6 px-6 py-5">
        <section>
          <h3 className="mb-4 text-base font-bold">Identificación</h3>
          <div className="grid gap-4 sm:grid-cols-[10rem_1fr]">
            <Field label="Tipo" htmlFor="es-tipo" error={errors.tipo_documento_id?.message} required>
              <Controller
                control={control}
                name="tipo_documento_id"
                render={({ field }) => (
                  <Select
                    id="es-tipo"
                    placeholder="Selecciona"
                    options={tipos
                      .filter((t) => t.activo && t.codigo !== 'NIT')
                      .map((t) => ({
                        value: t.id,
                        label: `${t.codigo} · ${t.nombre}`,
                      }))}
                    invalid={!!errors.tipo_documento_id}
                    {...field}
                  />
                )}
              />
            </Field>
            <Field label="Número de documento" htmlFor="es-doc" error={errors.numero_documento?.message} required>
              <Input id="es-doc" autoComplete="off" invalid={!!errors.numero_documento} {...register('numero_documento')} />
            </Field>
            <Field label="Nombres" htmlFor="es-nombres" error={errors.nombres?.message} required>
              <Input id="es-nombres" invalid={!!errors.nombres} {...register('nombres')} />
            </Field>
            <Field label="Apellidos" htmlFor="es-apellidos" error={errors.apellidos?.message} required>
              <Input id="es-apellidos" invalid={!!errors.apellidos} {...register('apellidos')} />
            </Field>
            <Field
              label="Registro profesional"
              htmlFor="es-registro"
              error={errors.registro_profesional?.message}
              hint="ReTHUS o tarjeta profesional."
              className="sm:col-span-2"
            >
              <Input id="es-registro" invalid={!!errors.registro_profesional} {...register('registro_profesional')} />
            </Field>
          </div>
        </section>

        <section className="border-t border-line pt-6">
          <h3 className="text-base font-bold">Especialidades</h3>
          <p className="mt-0.5 mb-3 text-sm text-muted">Lo que puede atender. Kizuna solo le asigna CUPS de estas especialidades.</p>
          <Controller
            control={control}
            name="especialidad_ids"
            render={({ field }) => (
              // El botón va primero y las etiquetas debajo: así el menú abierto no se mueve al elegir.
              <div className="space-y-3">
                <EspecialidadesPicker
                  etiqueta="Agregar especialidad"
                  textoBoton="Agregar especialidad"
                  alinear="izquierda"
                  especialidades={especialidades}
                  seleccionadas={field.value}
                  onAlternar={(id, asignar) => field.onChange(asignar ? [...field.value, id] : field.value.filter((x) => x !== id))}
                />
                {field.value.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {field.value.map((id) => {
                      const e = especialidades.find((x) => x.id === id);
                      return (
                        <span key={id} className="inline-flex items-center gap-1 rounded-full bg-mist py-1 pr-1 pl-3 text-sm font-semibold text-mist-ink">
                          {e?.nombre ?? '…'}
                          <button
                            type="button"
                            onClick={() => field.onChange(field.value.filter((x) => x !== id))}
                            aria-label={`Quitar ${e?.nombre ?? 'especialidad'}`}
                            className="flex size-6 cursor-pointer items-center justify-center rounded-full hover:bg-petrol/10"
                          >
                            <X className="size-3.5" />
                          </button>
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          />
          {errors.especialidad_ids?.message && <p className="mt-2 text-[0.8rem] font-medium text-danger">{errors.especialidad_ids.message}</p>}
        </section>

        <section className="border-t border-line pt-6">
          <h3 className="mb-4 text-base font-bold">Contacto</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Correo" htmlFor="es-correo" error={errors.correo?.message}>
              <Input id="es-correo" type="email" invalid={!!errors.correo} {...register('correo')} />
            </Field>
            <Field label="Teléfono" htmlFor="es-tel" error={errors.telefono?.message}>
              <Input id="es-tel" type="tel" invalid={!!errors.telefono} {...register('telefono')} />
            </Field>
          </div>
        </section>

        {can(PERMISOS.usuarios.listar) && (
          <section className="border-t border-line pt-6">
            <h3 className="text-base font-bold">Cuenta en Kizuna</h3>
            <p className="mt-0.5 mb-3 text-sm text-muted">Si el profesional usa Kizuna, vincula su cuenta: firma sus historias y ve su propia agenda.</p>
            <Controller
              control={control}
              name="user_id"
              render={({ field }) => (
                <Select
                  aria-label="Cuenta de usuario"
                  placeholder="Sin cuenta vinculada"
                  options={(usuarios?.datos ?? []).map((u) => ({ value: u.id, label: `${u.name} · ${u.email}` }))}
                  {...field}
                />
              )}
            />
            {errors.user_id?.message && <p className="mt-2 text-[0.8rem] font-medium text-danger">{errors.user_id.message}</p>}
          </section>
        )}

        <section className="border-t border-line pt-6">
          <Controller
            control={control}
            name="activo"
            render={({ field }) => (
              <Switch
                checked={field.value}
                onChange={field.onChange}
                label="Especialista activo"
                description="Kizuna no programa citas con profesionales inactivos."
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
          {especialista ? 'Guardar cambios' : 'Crear especialista'}
        </Button>
      </div>
    </form>
  );
}
