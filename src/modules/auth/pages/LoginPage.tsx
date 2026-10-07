import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useLocation, useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowRight, Eye, EyeOff, Lock, Mail } from 'lucide-react';
import { Logo } from '@/components/brand/Logo';
import { Button, Field, Input } from '@/components/ui';
import { getErrorMessage } from '@/lib/api/errors';
import { notify } from '@/lib/toast';
import { SchedulingPreview } from '../components/SchedulingPreview';
import { useAuth } from '../hooks/useAuth';

const loginSchema = z.object({
  email: z.string().trim().min(1, 'El correo electrónico es obligatorio.').pipe(z.email('El formato del correo no es válido.')),
  password: z.string().min(1, 'La contraseña es obligatoria.'),
});

type LoginForm = z.infer<typeof loginSchema>;

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (values: LoginForm) => {
    setFormError(null);
    try {
      const usuario = await login(values);
      notify.success(`Bienvenido, ${usuario.operador?.nombre ?? usuario.name}.`);
      const from = (location.state as { from?: string } | null)?.from;
      navigate(from && from !== '/login' ? from : '/', { replace: true });
    } catch (error) {
      setFormError(getErrorMessage(error));
    }
  };

  return (
    <div className="grid min-h-dvh bg-surface lg:grid-cols-[1.1fr_1fr]">
      {/* Historia de marca */}
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-paper px-12 py-10 lg:flex xl:px-16">
        <Logo size="md" className="self-start" />

        <div className="grid items-center gap-10 2xl:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="max-w-xl">
            <h1 className="animate-enter text-5xl leading-[1.04] font-extrabold tracking-[-0.03em] xl:text-[3.5rem]">
              Cada paciente, <span className="text-mint-ink">en su cita</span>.
            </h1>
            <p className="animate-enter mt-6 text-lg leading-relaxed text-body [animation-delay:100ms]">
              Kizuna cruza los contratos de tu IPS, sus poblaciones, el portafolio CUPS y la agenda de tus especialistas para programar a los pacientes de forma automática.
            </p>
          </div>
          <SchedulingPreview />
        </div>

        <p className="text-sm text-muted">Un producto de Proccesa</p>
      </aside>

      {/* Formulario */}
      <main className="flex flex-col items-center justify-center px-6 py-12 sm:px-12">
        <div className="w-full max-w-sm">
          <Logo size="md" className="mb-12 self-start lg:hidden" />

          <h2 className="text-3xl font-bold tracking-tight">Hola de nuevo</h2>
          <p className="mt-1.5 text-muted">Ingresa con tu correo de trabajo.</p>

          {formError && (
            <div role="alert" className="mt-6 flex items-start gap-2.5 rounded-xl bg-danger-soft px-4 py-3 text-sm font-medium text-danger">
              <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
              {formError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-8 flex flex-col gap-5">
            <Field label="Correo electrónico" htmlFor="email" error={errors.email?.message}>
              <Input
                id="email"
                type="email"
                icon={Mail}
                autoComplete="email"
                placeholder="nombre@empresa.com"
                invalid={!!errors.email}
                className="h-12"
                {...register('email')}
              />
            </Field>

            <Field label="Contraseña" htmlFor="password" error={errors.password?.message}>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  icon={Lock}
                  autoComplete="current-password"
                  placeholder="Tu contraseña"
                  invalid={!!errors.password}
                  className="h-12 pr-11"
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  className="absolute top-1/2 right-2 flex size-8 -translate-y-1/2 cursor-pointer items-center justify-center rounded-lg text-muted hover:bg-sand hover:text-ink"
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </Field>

            <Button type="submit" variant="mint" size="lg" iconRight={ArrowRight} isLoading={isSubmitting} className="mt-2 w-full">
              Entrar
            </Button>
          </form>

          <p className="mt-10 text-center text-sm text-muted lg:hidden">Un producto de Proccesa</p>
        </div>
      </main>
    </div>
  );
}
