import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '@/lib/api';
import { Lock, Mail, User, AlertCircle, ArrowRight } from 'lucide-react';

const authSchema = z.object({
  email: z.string().email('Correo electrónico no válido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  nombre: z.string().optional(),
});

type AuthFormData = z.infer<typeof authSchema>;

export function LoginForm() {
  const [isRegister, setIsRegister] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<AuthFormData>({
    resolver: zodResolver(authSchema),
  });

  const onSubmit = async (values: AuthFormData) => {
    setServerError(null);
    setSuccessMessage(null);

    if (isRegister && (!values.nombre || values.nombre.trim().length < 2)) {
      setServerError('El nombre es obligatorio para el registro');
      return;
    }

    setLoading(true);

    try {
      if (isRegister) {
        const res = await api.auth.register({
          email: values.email,
          password: values.password,
          nombre: values.nombre || 'Investigador',
        });

        if (res.success) {
          setSuccessMessage('Registro exitoso. Ahora puedes iniciar sesión.');
          setIsRegister(false);
          reset();
        } else {
          setServerError(res.error || 'Error al registrar el usuario');
        }
      } else {
        const res = await api.auth.login({
          email: values.email,
          password: values.password,
        });

        if (res.success && res.data?.access_token) {
          // Check profile sync
          try {
            await api.auth.syncProfile();
          } catch {}
          window.location.href = '/informes';
        } else {
          setServerError(res.error || 'Credenciales inválidas');
        }
      }
    } catch (err: any) {
      setServerError(err.message || 'Error en la comunicación con el servidor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-white border border-border rounded-[4px] p-6 text-ink">
      <div className="mb-6 pb-4 border-b border-border">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-6 h-6 bg-accent flex items-center justify-center rounded-[3px] text-white font-mono text-xs font-bold">
            IA
          </div>
          <span className="font-mono text-xs font-semibold tracking-wider uppercase text-ink">
            Instituto IASA · QA Data
          </span>
        </div>
        <h1 className="text-lg font-semibold tracking-tight">
          {isRegister ? 'Registro de Usuario' : 'Acceso a la Plataforma'}
        </h1>
        <p className="text-xs text-ink-muted mt-1 font-mono">
          {isRegister
            ? 'Crea tu cuenta de investigador o revisor'
            : 'Introduce tus credenciales para acceder al sistema'}
        </p>
      </div>

      {serverError && (
        <div className="mb-4 p-3 bg-red-50 border border-alarma/40 text-alarma text-xs rounded-[3px] flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span className="font-mono">{serverError}</span>
        </div>
      )}

      {successMessage && (
        <div className="mb-4 p-3 bg-green-50 border border-estado-aprobado/40 text-estado-aprobado text-xs rounded-[3px] font-mono">
          {successMessage}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {isRegister && (
          <div>
            <label className="block text-xs font-mono font-medium mb-1 text-ink">
              Nombre Completo
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-ink-subtle absolute left-2.5 top-2.5" />
              <input
                type="text"
                {...register('nombre')}
                placeholder="Dr. Carlos Mendoza"
                className="w-full pl-8 pr-3 py-2 text-xs border border-border rounded-[3px] bg-base focus:bg-white focus:outline-none focus:border-accent font-sans"
              />
            </div>
            {errors.nombre && (
              <p className="text-xs text-alarma mt-1 font-mono">{errors.nombre.message}</p>
            )}
          </div>
        )}

        <div>
          <label className="block text-xs font-mono font-medium mb-1 text-ink">
            Correo Institucional
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-ink-subtle absolute left-2.5 top-2.5" />
            <input
              type="email"
              {...register('email')}
              placeholder="investigador@iasa.edu"
              className="w-full pl-8 pr-3 py-2 text-xs border border-border rounded-[3px] bg-base focus:bg-white focus:outline-none focus:border-accent font-mono"
            />
          </div>
          {errors.email && (
            <p className="text-xs text-alarma mt-1 font-mono">{errors.email.message}</p>
          )}
        </div>

        <div>
          <label className="block text-xs font-mono font-medium mb-1 text-ink">
            Contraseña
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 text-ink-subtle absolute left-2.5 top-2.5" />
            <input
              type="password"
              {...register('password')}
              placeholder="••••••••"
              className="w-full pl-8 pr-3 py-2 text-xs border border-border rounded-[3px] bg-base focus:bg-white focus:outline-none focus:border-accent font-mono"
            />
          </div>
          {errors.password && (
            <p className="text-xs text-alarma mt-1 font-mono">{errors.password.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 px-4 bg-accent hover:bg-accent-hover text-white text-xs font-medium rounded-[3px] flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
        >
          {loading ? (
            <span className="font-mono">Procesando...</span>
          ) : (
            <>
              <span>{isRegister ? 'Registrar Cuenta' : 'Iniciar Sesión'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </>
          )}
        </button>
      </form>

      <div className="mt-6 pt-4 border-t border-border flex justify-between items-center text-xs">
        <button
          type="button"
          onClick={() => {
            setIsRegister(!isRegister);
            setServerError(null);
            setSuccessMessage(null);
          }}
          className="text-accent hover:underline font-mono text-[11px]"
        >
          {isRegister
            ? '¿Ya tienes una cuenta? Inicia sesión'
            : '¿No tienes cuenta? Regístrate'}
        </button>

        <span className="text-ink-subtle text-[11px] font-mono">v1.0.0</span>
      </div>
    </div>
  );
}
