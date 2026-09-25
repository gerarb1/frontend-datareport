import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '@/lib/api';
import { Lock, Mail, User, AlertCircle, ArrowRight } from 'lucide-react';
import { joinPresence } from '@/lib/presence';

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
          localStorage.setItem('access_token', res.data.access_token);
          localStorage.setItem('user', JSON.stringify(res.data.user));

          try {
            await api.auth.syncProfile();
          } catch { }

          // Unir a presencia ANTES de redirigir (no bloquea)
          joinPresence({
            id: res.data.user.id,
            nombre: res.data.user.nombre,
            rol: res.data.user.rol,
          });

          window.location.href = '/inicio';
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
    <div className="w-full max-w-md bg-white border border-[#E0E3E7] rounded-2xl p-8 shadow-google text-[#202124]">
      <div className="mb-6 pb-4 border-b border-[#E0E3E7]">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 bg-[#1A73E8] flex items-center justify-center rounded-xl text-white text-xs font-bold shadow-xs">
            IA
          </div>
          <div>
            <span className="text-xs font-bold text-[#202124] tracking-tight">
              IASA DataReport
            </span>
            <p className="text-[11px] text-[#5F6368]">Control de Calidad de Datos</p>
          </div>
        </div>
        <h1 className="text-xl font-bold tracking-tight text-[#202124]">
          {isRegister ? 'Crear Cuenta Institucional' : 'Acceso a la Plataforma'}
        </h1>
        <p className="text-xs text-[#5F6368] mt-1">
          {isRegister
            ? 'Introduce tus datos para registrarte en el sistema'
            : 'Introduce tus credenciales para acceder a tus expedientes'}
        </p>
      </div>

      {serverError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-[#D93025] text-xs rounded-lg flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{serverError}</span>
        </div>
      )}

      {successMessage && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 text-[#1E8E3E] text-xs rounded-lg">
          {successMessage}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {isRegister && (
          <div>
            <label className="block text-xs font-medium mb-1.5 text-[#202124]">
              Nombre Completo
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-[#80868B] absolute left-3 top-3" />
              <input
                type="text"
                {...register('nombre')}
                placeholder="Dr. Carlos Mendoza"
                className="w-full pl-9 pr-3.5 py-2.5 text-xs border border-[#E0E3E7] rounded-lg bg-white focus:outline-none focus:border-[#1A73E8] focus:ring-2 focus:ring-[#1A73E8]/20 transition"
              />
            </div>
            {errors.nombre && (
              <p className="text-xs text-[#D93025] mt-1">{errors.nombre.message}</p>
            )}
          </div>
        )}

        <div>
          <label className="block text-xs font-medium mb-1.5 text-[#202124]">
            Correo Electrónico
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-[#80868B] absolute left-3 top-3" />
            <input
              type="email"
              {...register('email')}
              placeholder="investigador@iasa.edu"
              className="w-full pl-9 pr-3.5 py-2.5 text-xs border border-[#E0E3E7] rounded-lg bg-white focus:outline-none focus:border-[#1A73E8] focus:ring-2 focus:ring-[#1A73E8]/20 transition font-mono"
            />
          </div>
          {errors.email && (
            <p className="text-xs text-[#D93025] mt-1">{errors.email.message}</p>
          )}
        </div>

        <div>
          <label className="block text-xs font-medium mb-1.5 text-[#202124]">
            Contraseña
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 text-[#80868B] absolute left-3 top-3" />
            <input
              type="password"
              {...register('password')}
              placeholder="••••••••"
              className="w-full pl-9 pr-3.5 py-2.5 text-xs border border-[#E0E3E7] rounded-lg bg-white focus:outline-none focus:border-[#1A73E8] focus:ring-2 focus:ring-[#1A73E8]/20 transition font-mono"
            />
          </div>
          {errors.password && (
            <p className="text-xs text-[#D93025] mt-1">{errors.password.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 px-4 bg-[#1A73E8] hover:bg-[#1557B0] text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition shadow-xs hover:shadow disabled:opacity-50"
        >
          {loading ? (
            <span>Procesando...</span>
          ) : (
            <>
              <span>{isRegister ? 'Registrar Cuenta' : 'Iniciar Sesión'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </>
          )}
        </button>
      </form>

      <div className="mt-6 pt-4 border-t border-[#E0E3E7] flex justify-between items-center text-xs">
        <button
          type="button"
          onClick={() => {
            setIsRegister(!isRegister);
            setServerError(null);
            setSuccessMessage(null);
          }}
          className="text-[#1A73E8] hover:underline font-medium text-xs"
        >
          {isRegister
            ? '¿Ya tienes una cuenta? Inicia sesión'
            : '¿No tienes cuenta? Regístrate'}
        </button>

        <span className="text-[#80868B] text-[11px] font-mono">IASA QC</span>
      </div>
    </div>
  );
}
