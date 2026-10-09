import { useEffect, useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Search } from 'lucide-react';
import { Button, Drawer, Field, Input, Select } from '@/components/ui';
import { cn } from '@/lib/cn';
import { applyServerErrors } from '@/lib/forms';
import { formatDate } from '@/lib/format';
import { notify } from '@/lib/toast';
import { SelectorCups } from '@/modules/catalogos/components/SelectorCups';
import { useTiposDocumento } from '@/modules/catalogos/hooks/useTiposDocumento';
import type { Cups } from '@/modules/catalogos/types';
import { useContratos } from '@/modules/contratacion/hooks/useContratacion';
import { useCirugiaMutations } from '../hooks/useCirugia';
import { formToOrdenPayload, ordenSchema, ordenVacia, type OrdenFormValues } from '../schema';
import { ordenesService } from '../services/cirugiaService';
import type { Orden } from '../types';

interface NuevaOrdenDrawerProps {
  open: boolean;
  onClose: () => void;
  onCreada: (orden: Orden) => void;
}

export function NuevaOrdenDrawer({ open, onClose, onCreada }: NuevaOrdenDrawerProps) {
  const [enviando, setEnviando] = useState(false);
  return (
    <Drawer open={open} onClose={onClose} width="lg" title="Nueva orden quirúrgica" dismissible={!enviando}>
      {/* El formulario se monta al abrir: cada orden empieza en blanco. */}
      <Formulario onClose={onClose} onCreada={onCreada} onEnviando={setEnviando} />
    </Drawer>
  );
}

function Formulario({ onClose, onCreada, onEnviando }: Omit<NuevaOrdenDrawerProps, 'open'> & { onEnviando: (v: boolean) => void }) {
  const { crear } = useCirugiaMutations();
  const { data: tipos = [] } = useTiposDocumento();
  const { data: contratos } = useContratos({ por_pagina: 100, estado: 'EN_EJECUCION' });
  const [cups, setCups] = useState<Map<number, Cups>>(new Map());
  const [buscando, setBuscando] = useState(false);
  const [pacienteExistente, setPacienteExistente] = useState(false);
  const form = useForm<OrdenFormValues>({ resolver: zodResolver(ordenSchema), defaultValues: ordenVacia() });
  const {
    register,
    control,
    setValue,
    formState: { errors, isSubmitting },
  } = form;

  useEffect(() => onEnviando(isSubmitting), [isSubmitting, onEnviando]);

  const [tipo, numero] = useWatch({ control, name: ['tipo_documento', 'numero_documento'] });

  const buscarPaciente = async () => {
    if (!numero) return;
    setBuscando(true);
    try {
      const p = await ordenesService.paciente(tipo, numero);
      setPacienteExistente(!!p);
      if (p) {
        for (const campo of ['primer_nombre', 'segundo_nombre', 'primer_apellido', 'segundo_apellido', 'fecha_nacimiento', 'telefono'] as const)
          setValue(campo, p[campo] ?? '');
        setValue('sexo', p.sexo);
      } else notify.info('Paciente nuevo: completa sus datos.');
    } finally {
      setBuscando(false);
    }
  };

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const r = await crear.mutateAsync(formToOrdenPayload(values));
      const o = r.datos;
      if (o.estado === 'CITA_ASIGNADA')
        notify.success(`Orden registrada · cita de pre-anestesia el ${formatDate(o.cita_actual?.fecha)} a las ${o.cita_actual?.hora_inicio}`);
      else if (o.estado === 'RECHAZADA') notify.error(`Orden rechazada: ${o.motivo_estado}`);
      else notify.info(`Orden registrada sin cita: ${o.motivo_estado}`);
      onCreada(o);
    } catch (error) {
      applyServerErrors(error, (campo, e) => form.setError(String(campo).replace('paciente.', '') as keyof OrdenFormValues, e));
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate className="flex min-h-full flex-col">
      <div className="flex-1 space-y-6 px-6 pb-6">
        <section>
          <h3 className="mb-1 text-base font-bold">Paciente</h3>
          <p className="mb-4 text-sm text-muted">Busca por documento: si ya existe, Kizuna completa sus datos.</p>
          <div className="grid gap-4 sm:grid-cols-[9rem_1fr_auto] sm:items-end">
            <Field label="Tipo" htmlFor="or-tipo" error={errors.tipo_documento?.message} required>
              <Select
                id="or-tipo"
                options={tipos.filter((t) => t.activo && t.codigo !== 'NIT').map((t) => ({ value: t.codigo, label: t.codigo }))}
                {...register('tipo_documento')}
              />
            </Field>
            <Field label="Número de documento" htmlFor="or-doc" error={errors.numero_documento?.message} required>
              <Input
                id="or-doc"
                autoComplete="off"
                invalid={!!errors.numero_documento}
                {...register('numero_documento')}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), buscarPaciente())}
              />
            </Field>
            <Button variant="secondary" icon={Search} onClick={buscarPaciente} isLoading={buscando} className={cn(errors.numero_documento && 'sm:mb-6')}>
              Buscar
            </Button>
          </div>
          {pacienteExistente && <p className="mt-2 text-sm font-medium text-success">Paciente encontrado: revisa que sus datos sigan vigentes.</p>}
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field label="Primer nombre" htmlFor="or-n1" error={errors.primer_nombre?.message} required>
              <Input id="or-n1" invalid={!!errors.primer_nombre} {...register('primer_nombre')} />
            </Field>
            <Field label="Segundo nombre" htmlFor="or-n2">
              <Input id="or-n2" {...register('segundo_nombre')} />
            </Field>
            <Field label="Primer apellido" htmlFor="or-a1" error={errors.primer_apellido?.message} required>
              <Input id="or-a1" invalid={!!errors.primer_apellido} {...register('primer_apellido')} />
            </Field>
            <Field label="Segundo apellido" htmlFor="or-a2">
              <Input id="or-a2" {...register('segundo_apellido')} />
            </Field>
            <Field label="Fecha de nacimiento" htmlFor="or-fn" error={errors.fecha_nacimiento?.message} required>
              <Input id="or-fn" type="date" invalid={!!errors.fecha_nacimiento} {...register('fecha_nacimiento')} />
            </Field>
            <Field label="Sexo" htmlFor="or-sexo" error={errors.sexo?.message} required>
              <Select
                id="or-sexo"
                options={[
                  { value: 'F', label: 'Femenino' },
                  { value: 'M', label: 'Masculino' },
                  { value: 'I', label: 'Indeterminado' },
                ]}
                {...register('sexo')}
              />
            </Field>
            <Field label="Teléfono" htmlFor="or-tel">
              <Input id="or-tel" type="tel" {...register('telefono')} />
            </Field>
          </div>
        </section>

        <section className="border-t border-line pt-6">
          <h3 className="mb-1 text-base font-bold">Procedimiento</h3>
          <p className="mb-4 text-sm text-muted">Kizuna verifica que la IPS tenga la especialidad que lo atiende y agenda la cita de pre-anestesia.</p>
          <Controller
            control={control}
            name="cups"
            render={({ field }) => (
              <SelectorCups
                seleccion={cups}
                error={errors.cups?.message}
                onAlternar={(c) => {
                  const nueva = cups.has(c.id) ? new Map() : new Map([[c.id, c]]);
                  setCups(nueva);
                  field.onChange(nueva.size ? c.codigo : '');
                }}
              />
            )}
          />
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field label="Diagnóstico CIE-10" htmlFor="or-cie" error={errors.diagnostico_cie10?.message}>
              <Input id="or-cie" placeholder="K802" className="uppercase" invalid={!!errors.diagnostico_cie10} {...register('diagnostico_cie10')} />
            </Field>
            <Field label="Prioridad" htmlFor="or-prio">
              <Select
                id="or-prio"
                options={[
                  { value: 'ELECTIVA', label: 'Electiva' },
                  { value: 'PRIORITARIA', label: 'Prioritaria' },
                ]}
                {...register('prioridad')}
              />
            </Field>
            <Field label="Descripción del diagnóstico" htmlFor="or-dx" className="sm:col-span-2">
              <Input id="or-dx" {...register('diagnostico')} />
            </Field>
            <Field label="Médico que ordena" htmlFor="or-med">
              <Input id="or-med" {...register('medico_ordenante')} />
            </Field>
            <Controller
              control={control}
              name="contrato_id"
              render={({ field }) => (
                <Field label="Contrato" htmlFor="or-contrato" hint="Si se indica, la cita se busca en las sedes del contrato.">
                  <Select
                    id="or-contrato"
                    placeholder="Sin contrato"
                    options={(contratos?.datos ?? []).map((c) => ({ value: c.id, label: `${c.numero} · ${c.entidad.sigla || c.entidad.razon_social}` }))}
                    {...field}
                  />
                </Field>
              )}
            />
          </div>
        </section>
      </div>

      <div className="sticky bottom-0 flex flex-col-reverse gap-2 border-t border-line bg-surface/95 px-6 py-4 backdrop-blur sm:flex-row sm:justify-end">
        <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
          Cancelar
        </Button>
        <Button type="submit" isLoading={isSubmitting}>
          Registrar y agendar
        </Button>
      </div>
    </form>
  );
}
