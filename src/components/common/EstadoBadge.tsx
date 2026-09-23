import React from 'react';
import type { EstadoInforme } from '@/lib/types';

interface EstadoBadgeProps {
  estado: EstadoInforme | string;
  className?: string;
  showDot?: boolean;
}

const ESTILOS: Record<string, { bg: string; text: string; dot: string; label: string; border: string }> = {
  borrador: {
    bg: 'bg-[#F1F3F4]',
    text: 'text-[#5F6368]',
    dot: 'bg-[#5F6368]',
    border: 'border-[#DADCE0]',
    label: 'Borrador',
  },
  enviado: {
    bg: 'bg-[#E8F0FE]',
    text: 'text-[#1967D2]',
    dot: 'bg-[#1A73E8]',
    border: 'border-[#CEE0FD]',
    label: 'Enviado',
  },
  en_revision: {
    bg: 'bg-[#E8F0FE]',
    text: 'text-[#1A73E8]',
    dot: 'bg-[#1A73E8]',
    border: 'border-[#CEE0FD]',
    label: 'En Revisión',
  },
  observado: {
    bg: 'bg-[#FEF7E0]',
    text: 'text-[#B06000]',
    dot: 'bg-[#E37400]',
    border: 'border-[#FEEFC3]',
    label: 'Observado',
  },
  aprobado: {
    bg: 'bg-[#E6F4EA]',
    text: 'text-[#137333]',
    dot: 'bg-[#1E8E3E]',
    border: 'border-[#CEEAD6]',
    label: 'Aprobado',
  },
  rechazado: {
    bg: 'bg-[#FCE8E6]',
    text: 'text-[#C5221F]',
    dot: 'bg-[#D93025]',
    border: 'border-[#FAD2CF]',
    label: 'Rechazado',
  },
};

export function EstadoBadge({ estado = 'borrador', className = '', showDot = true }: EstadoBadgeProps) {
  const safeEstado = estado || 'borrador';
  const config = ESTILOS[safeEstado] || {
    bg: 'bg-gray-100',
    text: 'text-gray-700',
    dot: 'bg-gray-500',
    border: 'border-gray-200',
    label: safeEstado.replace('_', ' '),
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-medium border rounded-full ${config.bg} ${config.text} ${config.border} ${className}`}
    >
      {showDot && <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${config.dot}`} />}
      <span>{config.label}</span>
    </span>
  );
}
