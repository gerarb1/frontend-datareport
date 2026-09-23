import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { HistorialTransicion } from '@/lib/types';
import { EstadoBadge } from '@/components/common/EstadoBadge';
import { History, ArrowRight, UserCheck, MessageSquare } from 'lucide-react';

interface HistorialEstadosProps {
  informeId: string;
}

export function HistorialEstados({ informeId }: HistorialEstadosProps) {
  const {
    data: res,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['historial', informeId],
    queryFn: () => api.informes.historial(informeId),
  });

  const historial: HistorialTransicion[] = res?.data || [];

  if (isLoading) {
    return (
      <div className="p-8 text-center text-xs text-[#5F6368] font-mono">
        <History className="w-5 h-5 mx-auto text-[#1A73E8] animate-spin mb-2" />
        Cargando bitácora de transiciones...
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-4 bg-[#FCE8E6] border border-[#FAD2CF] text-[#D93025] text-xs rounded-xl font-mono">
        Error al cargar el historial de estados.
      </div>
    );
  }

  if (historial.length === 0) {
    return (
      <div className="bg-white border border-[#E0E3E7] p-5 rounded-xl shadow-xs">
        <div className="flex items-center gap-2.5 pb-3 border-b border-[#E0E3E7]">
          <History className="w-4 h-4 text-[#1A73E8]" />
          <h3 className="text-sm font-semibold text-[#202124]">
            Bitácora de Estados y Trazabilidad
          </h3>
        </div>
        <p className="text-xs text-[#5F6368] mt-4">No hay transiciones registradas aún.</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-[#E0E3E7] p-5 rounded-xl shadow-xs space-y-4 text-[#202124]">
      <div className="flex items-center gap-2.5 pb-3 border-b border-[#E0E3E7]">
        <div className="w-8 h-8 rounded-lg bg-[#E8F0FE] text-[#1A73E8] flex items-center justify-center">
          <History className="w-4 h-4" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-[#202124]">
            Bitácora de Estados y Trazabilidad
          </h3>
          <p className="text-xs text-[#5F6368]">
            Historial cronológico de cambios de estado y dictámenes registrados
          </p>
        </div>
      </div>

      <div className="relative pl-7 space-y-5 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-[2px] before:bg-[#E0E3E7]">
        {historial.map((item, idx) => (
          <div key={item.id || idx} className="relative text-xs">
            <span className="absolute -left-7 top-1.5 w-3 h-3 rounded-full bg-[#1A73E8] ring-4 ring-[#E8F0FE]" />

            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <EstadoBadge estado={item.estado_anterior} showDot={false} />
              <ArrowRight className="w-3.5 h-3.5 text-[#5F6368]" />
              <EstadoBadge estado={item.estado_nuevo} />
              <span className="text-xs font-mono text-[#5F6368] ml-auto">
                {new Date(item.creado_en).toLocaleString('es-ES')}
              </span>
            </div>

            {item.comentario && (
              <div className="flex items-start gap-2 mt-2 bg-[#F8F9FA] p-3 rounded-lg border border-[#E0E3E7] text-xs">
                <MessageSquare className="w-4 h-4 text-[#5F6368] shrink-0 mt-0.5" />
                <span className="text-[#202124] leading-relaxed">{item.comentario}</span>
              </div>
            )}

            <div className="flex items-center gap-1.5 mt-1.5 text-[11px] font-mono text-[#5F6368]">
              <UserCheck className="w-3.5 h-3.5 text-[#1A73E8]" />
              <span>Operador: {item.cambiado_por}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
