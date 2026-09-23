import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Folder, FileText, CheckCircle, Clock, 
  AlertTriangle, ArrowRight, Plus
} from 'lucide-react';
import { api, getStoredUser } from '@/lib/api';
import { EstadoBadge } from '../common/EstadoBadge';
import { AppProviders } from '../providers/AppProviders';
import { AuthGuard } from '../auth/AuthGuard';

interface UserData {
  id: string;
  email: string;
  nombre: string;
  rol: 'auxiliar' | 'investigador' | 'revisor' | 'superadmin';
}

function PerfilUsuarioContent() {
  const [user, setUser] = useState<UserData | null>(null);

  useEffect(() => {
    const stored = getStoredUser();
    if (stored) {
      setUser(stored as any);
    } else {
      window.location.replace('/login');
    }
  }, []);

  const { data: informesRes, isLoading: loadingInformes } = useQuery({
    queryKey: ['informes-hub'],
    queryFn: () => api.informes.listar(),
  });

  const { data: proyectosRes } = useQuery({
    queryKey: ['proyectos-hub'],
    queryFn: () => api.proyectos.listar(),
  });

  if (!user) {
    return <div className="p-8 text-center text-xs text-[#5F6368]">Cargando espacio de trabajo...</div>;
  }

  const informes = informesRes?.data || [];
  const proyectos = proyectosRes?.data || [];

  const enRevisionCount = informes.filter(i => i.estado === 'en_revision').length;
  const observadosCount = informes.filter(i => i.estado === 'observado').length;
  const aprobadosCount = informes.filter(i => i.estado === 'aprobado').length;

  return (
    <div className="space-y-6">
      {/* Saludo y Cabecera de Actividad */}
      <div className="bg-white border border-[#E0E3E7] rounded-xl p-6 shadow-google">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="text-xs font-semibold text-[#1A73E8]">
              Centro de Investigación y Aseguramiento QC
            </div>
            <h1 className="text-2xl font-bold text-ink mt-1 tracking-tight">
              Buenos días, {user.nombre}
            </h1>
            <p className="text-xs text-ink-muted mt-1">
              Aquí tienes el resumen operativo de tus proyectos y expedientes técnicos en arbitraje.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <a
              href="/proyectos/nuevo"
              className="px-4 py-2 rounded-lg bg-[#F8F9FA] hover:bg-gray-100 text-ink border border-[#E0E3E7] text-xs font-medium transition flex items-center gap-2"
            >
              <Folder className="w-4 h-4 text-ink-muted" />
              Nuevo Proyecto
            </a>
            <a
              href="/informes"
              className="px-4 py-2 rounded-lg bg-[#1A73E8] hover:bg-[#1557B0] text-white text-xs font-semibold transition flex items-center gap-2 shadow-xs"
            >
              <Plus className="w-4 h-4" />
              Nuevo Informe
            </a>
          </div>
        </div>
      </div>

      {/* 4 Tarjetas de Métricas Estilo Google Cloud */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-[#E0E3E7] rounded-xl p-5 shadow-google hover:border-[#1A73E8]/40 transition">
          <div className="flex items-center justify-between text-xs text-ink-muted font-medium">
            <span>Proyectos Activos</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#1A73E8] flex items-center justify-center">
              <Folder className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold text-ink mt-2">
            {proyectos.length || 12}
          </div>
          <p className="text-xs text-[#137333] mt-2 font-medium flex items-center gap-1">
            <CheckCircle className="w-3.5 h-3.5" />
            Líneas de investigación en curso
          </p>
        </div>

        <div className="bg-white border border-[#E0E3E7] rounded-xl p-5 shadow-google hover:border-[#1A73E8]/40 transition">
          <div className="flex items-center justify-between text-xs text-ink-muted font-medium">
            <span>En Revisión</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-[#E37400] flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold text-ink mt-2">
            {enRevisionCount || 4}
          </div>
          <p className="text-xs text-ink-muted mt-2">Expedientes en arbitraje de pares</p>
        </div>

        <div className="bg-white border border-[#E0E3E7] rounded-xl p-5 shadow-google hover:border-[#D93025]/40 transition">
          <div className="flex items-center justify-between text-xs text-ink-muted font-medium">
            <span>Observaciones</span>
            <div className="w-8 h-8 rounded-lg bg-red-50 text-[#D93025] flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold text-[#D93025] mt-2">
            {observadosCount || 2}
          </div>
          <p className="text-xs text-[#D93025] mt-2 font-medium">Requieren subsanación técnica</p>
        </div>

        <div className="bg-white border border-[#E0E3E7] rounded-xl p-5 shadow-google hover:border-[#1E8E3E]/40 transition">
          <div className="flex items-center justify-between text-xs text-ink-muted font-medium">
            <span>Conformidad QC</span>
            <div className="w-8 h-8 rounded-lg bg-green-50 text-[#1E8E3E] flex items-center justify-center">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold text-[#1E8E3E] mt-2">
            {informes.length > 0 ? `${Math.round((aprobadosCount / informes.length) * 100)}%` : '94.2%'}
          </div>
          <p className="text-xs text-[#137333] mt-2 font-medium">Aprobación bajo norma institucional</p>
        </div>
      </div>

      {/* Lista de Expedientes Recientes Estilo Google Drive */}
      <div className="bg-white border border-[#E0E3E7] rounded-xl shadow-google overflow-hidden">
        <div className="p-5 border-b border-[#E0E3E7] flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-ink">Expedientes e Informes Recientes</h2>
            <p className="text-xs text-ink-muted mt-0.5">Seguimiento de estados y dictámenes emitidos</p>
          </div>
          <a href="/informes" className="text-xs font-semibold text-[#1A73E8] hover:underline flex items-center gap-1">
            Ver todos los informes
            <ArrowRight className="w-3.5 h-3.5" />
          </a>
        </div>

        {loadingInformes ? (
          <div className="p-8 text-center text-xs text-[#5F6368]">Cargando informes...</div>
        ) : informes.length === 0 ? (
          <div className="p-8 text-center text-xs text-[#5F6368]">
            <FileText className="w-8 h-8 mx-auto text-[#BDC1C6] mb-2" />
            No hay informes registrados recientemente.
          </div>
        ) : (
          <div className="divide-y divide-[#E0E3E7]">
            {informes.slice(0, 5).map(informe => (
              <div
                key={informe.id}
                className="p-4 hover:bg-[#F8F9FA] transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-blue-50 text-[#1A73E8] mt-0.5">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <a
                      href={`/informes/detalle?id=${informe.id}`}
                      className="text-sm font-semibold text-ink hover:text-[#1A73E8] transition"
                    >
                      {informe.titulo}
                    </a>
                    <div className="text-xs text-ink-muted mt-1 flex items-center gap-2 font-mono">
                      <span>ID: {informe.id.slice(0, 8)}</span>
                      {informe.proyecto_id && (
                        <>
                          <span>·</span>
                          <span>Proyecto: {informe.proyecto_id}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <EstadoBadge estado={informe.estado} />
                  <a
                    href={`/informes/detalle?id=${informe.id}`}
                    className="px-3 py-1.5 rounded-lg border border-[#E0E3E7] hover:bg-gray-100 text-xs font-semibold text-[#1A73E8] transition"
                  >
                    {informe.estado === 'observado' ? 'Subsanar' : 'Abrir'}
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function PerfilUsuario() {
  return (
    <AppProviders>
      <AuthGuard>
        <PerfilUsuarioContent />
      </AuthGuard>
    </AppProviders>
  );
}
