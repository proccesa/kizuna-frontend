import { useState, type ReactNode } from 'react';
import { Controller, FormProvider, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff } from 'lucide-react';
import { Button, Checkbox, Field, Input, Skeleton, Switch } from '@/components/ui';
import { applyServerErrors } from '@/lib/forms';
import { humanize } from '@/lib/format';
import { useAuth } from '@/modules/auth/hooks/useAuth';
import { PERMISOS } from '@/modules/auth/permisos';
import { OperadorFields } from '@/modules/operadores/components/OperadorFields';
import { useRoles } from '@/modules/roles/hooks/useRoles';
import { useUsuarioMutations } from '../hooks/useUsuarios';
import { formToPayload, usuarioSchema, usuarioToForm, type UsuarioFormValues } from '../schema';
import type { Usuario } from '../types';

interface UsuarioFormProps {
  /** Usuario a editar. `null` para crear. */
  usuario: Usuario | null;
  /** Abre el formulario con la sección de operador activada. */
  vincularOperador?: boolean;
  onCancel: () => void;
  onSaved: (usuario: Usuario) => void;
}

function Section({ index, title, description, children }: { index: string; title: string; description?: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-4 px-6 py-6 not-first:border-t not-first:border-line">
      <div className="flex items-center gap-3">
        <span className="tabular flex size-6 shrink-0 items-center justify-center rounded-full bg-mist text-xs font-bold text-mist-ink">{Number(index)}</span>
        <div>
          <h3 className="text-base font-bold">{title}</h3>
          {description && <p className="mt-0.5 text-xs text-muted">{description}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}

export function UsuarioForm({ usuario, vincularOperador = false, onCancel, onSaved }: UsuarioFormProps) {
  const isEdit = !!usuario;
  const { can } = useAuth();
  const puedeVerRoles = can(PERMISOS.roles.listar);
  const { data: roles = [], isLoading: cargandoRoles } = useRoles(puedeVerRoles);
  const { crear, actualizar } = useUsuarioMutations();
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<UsuarioFormValues>({
    resolver: zodResolver(usuarioSchema),
    defaultValues: { ...usuarioToForm(usuario), conOperador: !!usuario?.operador || vincularOperador },
  });
  const {
    register,
    control,
    formState: { errors, isSubmitting },
  } = form;

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const payload = formToPayload(values);
      const response = usuario ? await actualizar.mutateAsync({ id: usuario.id, payload }) : await crear.mutateAsync(payload);
      onSaved(response.datos);
    } catch (error) {
      applyServerErrors(error, form.setError);
    }
  });

  const conOperador = useWatch({ control, name: 'conOperador' });
  // El backend no desvincula operadores al editar, así que no se ofrece quitarlo.
  const operadorBloqueado = isEdit && !!usuario.operador;

  return (
    <FormProvider {...form}>
      <form onSubmit={onSubmit} noValidate className="flex min-h-full flex-col">
        <div className="flex-1">
          <Section index="01" title="Cuenta de acceso">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Nombre de usuario" htmlFor="usr-name" error={errors.name?.message} required>
                <Input id="usr-name" autoComplete="off" invalid={!!errors.name} {...register('name')} />
              </Field>
              <Field label="Correo electrónico" htmlFor="usr-email" error={errors.email?.message} required>
                <Input id="usr-email" type="email" autoComplete="off" invalid={!!errors.email} {...register('email')} />
              </Field>
              <Field
                label={isEdit ? 'Nueva contraseña' : 'Contraseña'}
                htmlFor="usr-password"
                error={errors.password?.message}
                hint={isEdit ? 'Déjala vacía para mantener la actual.' : 'Mínimo 8 caracteres.'}
                required={!isEdit}
                className="sm:col-span-2"
              >
                <div className="relative">
                  <Input
                    id="usr-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    invalid={!!errors.password}
                    className="pr-11"
                    {...register('password')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    className="absolute top-1/2 right-2 flex size-8 -translate-y-1/2 cursor-pointer items-center justify-center rounded-lg text-subtle hover:bg-sand hover:text-ink"
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </Field>
            </div>
          </Section>

          {puedeVerRoles && (
            <Section index="02" title="Roles" description="Definen qué puede ver y hacer esta cuenta.">
              {cargandoRoles ? (
                <div className="grid gap-2.5 sm:grid-cols-2">
                  {Array.from({ length: 4 }, (_, i) => (
                    <Skeleton key={i} className="h-14" />
                  ))}
                </div>
              ) : (
                <Controller
                  control={control}
                  name="roles"
                  render={({ field }) => (
                    <div className="grid gap-2.5 sm:grid-cols-2">
                      {roles.map((rol) => (
                        <Checkbox
                          key={rol.id}
                          id={`rol-${rol.id}`}
                          label={humanize(rol.name)}
                          description={`${rol.permissions?.length ?? 0} permisos`}
                          checked={field.value.includes(rol.name)}
                          onChange={(e) =>
                            field.onChange(e.target.checked ? [...field.value, rol.name] : field.value.filter((name) => name !== rol.name))
                          }
                        />
                      ))}
                    </div>
                  )}
                />
              )}
            </Section>
          )}

          <Section index={puedeVerRoles ? '03' : '02'} title="Operador vinculado">
            <div className="rounded-2xl bg-cream p-4">
              <Controller
                control={control}
                name="conOperador"
                render={({ field }) => (
                  <Switch
                    checked={field.value}
                    onChange={field.onChange}
                    disabled={operadorBloqueado}
                    label="Vincular un operador"
                    description={
                      operadorBloqueado
                        ? 'Esta cuenta ya tiene un operador vinculado; puedes actualizar sus datos.'
                        : 'Datos personales de la persona que usará esta cuenta.'
                    }
                  />
                )}
              />
            </div>
            {conOperador && <OperadorFields prefix="operador" />}
          </Section>

          <Section index={puedeVerRoles ? '04' : '03'} title="Estado">
            <Controller
              control={control}
              name="activo"
              render={({ field }) => (
                <Switch
                  checked={field.value}
                  onChange={field.onChange}
                  label="Cuenta activa"
                  description="Las cuentas inactivas no pueden iniciar sesión y sus sesiones abiertas se cierran."
                />
              )}
            />
          </Section>
        </div>

        <div className="sticky bottom-0 flex flex-col-reverse gap-2 border-t border-line bg-surface/95 px-6 py-4 backdrop-blur sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={onCancel} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            {isEdit ? 'Guardar cambios' : 'Crear usuario'}
          </Button>
        </div>
      </form>
    </FormProvider>
  );
}
