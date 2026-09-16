import React, { useEffect, useState } from 'react';
import {
  FolderKanban,
  FileText,
  CheckSquare,
  BarChart3,
  ShieldCheck,
  LogOut,
  Activity,
  Database,
  User as UserIcon,
} from 'lucide-react';
import { getStoredUser, api } from '@/lib/api';
import type { Usuario, Rol } from '@/lib/types';

interface SidebarProps {
  currentPath?: string;
}

export function Sidebar({ currentPath = '' }: SidebarProps) {
  const [user, setUser] = useState<Usuario | null>(null);
  const [healthOk, setHealthOk] = useState<boolean | null>(null);

  useEffect(() => {
    const stored = getStoredUser();
    if (stored) {
      setUser(stored);
    } else {
      api.auth.me().then((res) => {
        if (res.data) setUser(res.data);
      }).catch(() => {});
    }

    // Health check instrumental
    api.health.check()
      .then((res) => setHealthOk(res.data?.status === 'ok'))
      .catch(() => setHealthOk(false));
  }, []);

  const rol: Rol = user?.rol || 'investigador';

  const menuItems = [
    {
      title: 'Proyectos',
      href: '/proyectos',
      icon: FolderKanban,
      visible: true,
    },
    {
      title: 'Informes y Trabajos',
      href: '/informes',
      icon: FileText,
      visible: true,
    },
    {
      title: 'Panel Métricas',
      href: '/admin/dashboard',
      icon: BarChart3,
      visible: rol === 'superadmin' || rol === 'revisor',
    },
    {
      title: 'Registro Auditoría',
      href: '/admin/auditoria',
      icon: ShieldCheck,
      visible: rol === 'superadmin',
    },
  ];

  const handleLogout = async () => {
    await api.auth.logout();
    window.location.href = '/login';
  };

  return (
    <aside className="w-64 bg-[#EBECE8] border-r border-border flex flex-col h-screen shrink-0 text-ink select-none">
      {/* Brand Header */}
      <div className="p-4 border-b border-border bg-[#E4E6E1]">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-accent flex items-center justify-center rounded-[3px] text-base font-bold text-white text-xs">
              IA
            </div>
            <span className="font-semibold tracking-wider text-xs uppercase font-mono">IASA · DataReport</span>
          </div>
          <span
            title={healthOk === true ? 'API v1 En Línea' : healthOk === false ? 'API Sin Conexión' : 'Verificando...'}
            className={`w-2 h-2 rounded-full ${
              healthOk === true
                ? 'bg-estado-aprobado'
                : healthOk === false
                ? 'bg-alarma'
                : 'bg-estado-recibido animate-pulse'
            }`}
          />
        </div>
        <div className="text-[11px] text-ink-muted font-mono flex items-center gap-1 mt-1">
          <span>SISTEMA QC</span>
          <span>·</span>
          <span className="text-accent font-semibold uppercase">{rol}</span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        <div className="px-2 py-1 text-[10px] font-mono uppercase tracking-wider text-ink-subtle">
          Módulos de Control
        </div>
        {menuItems
          .filter((item) => item.visible)
          .map((item) => {
            const Icon = item.icon;
            const isActive = currentPath === item.href || (item.href !== '/' && currentPath.startsWith(item.href));
            return (
              <a
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-[3px] transition-colors border ${
                  isActive
                    ? 'bg-white text-ink border-border shadow-none font-semibold'
                    : 'text-ink-muted hover:text-ink hover:bg-[#DEE1DC] border-transparent'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-accent' : 'text-ink-subtle'}`} />
                <span>{item.title}</span>
              </a>
            );
          })}
      </nav>

      {/* User & Session Footer */}
      <div className="p-3 border-t border-border bg-[#E4E6E1]">
        <div className="flex items-center gap-2.5 mb-2 px-1">
          <div className="w-7 h-7 rounded-[3px] bg-white border border-border flex items-center justify-center text-ink-muted shrink-0 font-mono text-xs">
            {user?.nombre ? user.nombre.charAt(0).toUpperCase() : <UserIcon className="w-3.5 h-3.5" />}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium truncate text-ink">{user?.nombre || 'Usuario'}</p>
            <p className="text-[10px] font-mono text-ink-subtle truncate">{user?.email || 'verificando...'}</p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-1.5 px-2 py-1.5 text-xs text-ink-muted hover:text-ink hover:bg-[#DEE1DC] border border-border rounded-[3px] transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </aside>
  );
}
