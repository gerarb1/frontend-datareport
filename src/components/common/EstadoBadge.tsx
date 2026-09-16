import React from 'react';
import type { EstadoInforme } from '@/lib/types';

interface EstadoBadgeProps {
  estado: EstadoInforme | string;
  className?: string;
  showDot?: boolean;
}

const ESTILOS: Record<string, { bg: string; text: string; dot: string; label: string }> = {
  borrador: {
    bg: 'bg-[#8A9694]/10',
    text: 'text-[#616B69]',
    dot: 'bg-[#616B69]',
    label: 'Borrador',
  },
  recibido: {
    bg: 'bg-[#8A9694]/15',
    text: 'text-[#545F5E]',
    dot: 'bg-[#8A9694]',
    label: 'Recibido',
  },
  enviado: {
    bg: 'bg-[#136F63]/10',
    text: 'text-[#136F63]',
    dot: 'bg-[#136F63]',
    label: 'Enviado',
  },
  en_revision: {
    bg: 'bg-[#136F63]/15',
    text: 'text-[#136F63]',
    dot: 'bg-[#136F63]',
    label: 'En Revisión',
  },
  observado: {
    bg: 'bg-[#C97A2B]/15',
    text: 'text-[#A05C18]',
    dot: 'bg-[#C97A2B]',
    label: 'Observado',
  },
  corregido: {
    bg: 'bg-[#3B6EA5]/15',
    text: 'text-[#2C5684]',
    dot: 'bg-[#3B6EA5]',
    label: 'Corregido',
  },
  aprobado: {
    bg: 'bg-[#3E7D53]/15',
    text: 'text-[#2F6140]',
    dot: 'bg-[#3E7D53]',
    label: 'Aprobado',
  },
  rechazado: {
    bg: 'bg-[#C4432B]/15',
    text: 'text-[#A33420]',
    dot: 'bg-[#C4432B]',
    label: 'Rechazado',
  },
};

export function EstadoBadge({ estado, className = '', showDot = true }: EstadoBadgeProps) {
  const config = ESTILOS[estado] || {
    bg: 'bg-gray-100',
    text: 'text-gray-700',
    dot: 'bg-gray-500',
    label: estado.replace('_', ' '),
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-mono font-medium border border-current/20 rounded-[4px] ${config.bg} ${config.text} ${className}`}
    >
      {showDot && <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`} />}
      <span className="capitalize">{config.label}</span>
    </span>
  );
}
