import React, { useState, useEffect } from 'react';
import { Home, FileText, Folder, BarChart2, ShieldCheck, LogOut, Menu, X, CheckSquare } from 'lucide-react';
import { getStoredUser, api } from '@/lib/api';

interface SidebarProps {
  currentPath?: string;
}

export function Sidebar({ currentPath }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [user, setUser] = useState<{ nombre: string; email: string; rol: string } | null>(null);

  useEffect(() => {
    const stored = getStoredUser();
    if (stored) setUser(stored as any);
  }, []);

  const handleLogout = () => {
    api.auth.logout();
    window.location.replace('/login');
  };

  interface NavItem {
    name: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
    roles: string[];
    badge?: string;
  }

  interface NavSection {
    title: string;
    items: NavItem[];
  }

  const navSections: NavSection[] = [
    {
      title: 'General',
      items: [
        { name: 'Inicio', href: '/inicio', icon: Home, roles: ['auxiliar', 'investigador', 'revisor', 'superadmin'] },
        { name: 'Informes', href: '/informes', icon: FileText, roles: ['auxiliar', 'investigador', 'revisor', 'superadmin'] },
        { name: 'Proyectos', href: '/proyectos', icon: Folder, roles: ['investigador', 'superadmin'] },
      ]
    },
    {
      title: 'Evaluación',
      items: [
        { name: 'Consola QC', href: '/informes', icon: CheckSquare, roles: ['revisor', 'superadmin'], badge: '1 act.' },
      ]
    },
    {
      title: 'Gestión',
      items: [
        { name: 'Telemetría', href: '/admin/dashboard', icon: BarChart2, roles: ['revisor', 'superadmin'] },
        { name: 'Auditoría', href: '/admin/auditoria', icon: ShieldCheck, roles: ['superadmin'] },
      ]
    }
  ];

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  return (
    <>
      {/* Botón flotante móvil para abrir el sidebar */}
      <button
        onClick={() => setIsMobileOpen(true)}
        className="lg:hidden fixed top-3.5 left-4 z-50 p-2 rounded-lg bg-white border border-[#E0E3E7] shadow-sm text-[#5F6368] hover:text-[#202124]"
        title="Abrir menú"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Backdrop móvil */}
      {isMobileOpen && (
        <div
          onClick={() => setIsMobileOpen(false)}
          className="lg:hidden fixed inset-0 bg-black/30 z-40 backdrop-blur-xs transition-opacity"
        />
      )}

      {/* Contenedor del Sidebar */}
      <aside
        className={`fixed lg:static top-0 bottom-0 left-0 z-50 bg-white border-r border-[#E0E3E7] flex flex-col shrink-0 select-none transition-all duration-300 ease-in-out ${
          isCollapsed ? 'lg:w-[72px]' : 'lg:w-64'
        } ${isMobileOpen ? 'w-64 translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Cabecera del Sidebar con Logotipo y Botón Hamburguesa */}
        <div className="h-16 px-4 border-b border-[#E0E3E7] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-[#1A73E8] text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
              IA
            </div>
            {!isCollapsed && (
              <div className="truncate">
                <div className="font-bold text-sm text-[#202124] tracking-tight">IASA DataReport</div>
                <p className="text-[11px] text-[#5F6368] leading-tight">Control de Calidad</p>
              </div>
            )}
          </div>

          {/* Botón Hamburguesa Desktop */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:flex p-1.5 rounded-lg hover:bg-gray-100 text-[#5F6368] hover:text-[#202124] transition shrink-0"
            title={isCollapsed ? 'Expandir barra lateral' : 'Colapsar barra lateral'}
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Botón Cerrar Móvil */}
          <button
            onClick={() => setIsMobileOpen(false)}
            className="lg:hidden p-1.5 rounded-lg hover:bg-gray-100 text-[#5F6368]"
            title="Cerrar menú"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Enlaces de Navegación */}
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
          {navSections.map(section => {
            const visibleItems = section.items.filter(
              item => !user || item.roles.includes(user.rol)
            );
            if (visibleItems.length === 0) return null;

            return (
              <div key={section.title}>
                {!isCollapsed && (
                  <p className="px-3 text-[11px] font-semibold text-[#80868B] uppercase tracking-wider mb-1.5">
                    {section.title}
                  </p>
                )}
                <nav className="space-y-1">
                  {visibleItems.map(item => {
                    const isActive = currentPath?.startsWith(item.href);
                    const Icon = item.icon;

                    return (
                      <a
                        key={item.name}
                        href={item.href}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition ${
                          isActive
                            ? 'bg-[#E8F0FE] text-[#1A73E8] font-semibold'
                            : 'text-[#5F6368] hover:bg-gray-100 hover:text-[#202124]'
                        }`}
                        title={isCollapsed ? item.name : undefined}
                      >
                        <div className="flex items-center gap-3 truncate">
                          <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-[#1A73E8]' : 'text-[#5F6368]'}`} />
                          {!isCollapsed && <span className="truncate">{item.name}</span>}
                        </div>
                        {!isCollapsed && item.badge && (
                          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-[#E6F4EA] text-[#137333]">
                            {item.badge}
                          </span>
                        )}
                      </a>
                    );
                  })}
                </nav>
              </div>
            );
          })}
        </div>

        {/* Ficha de Usuario Inferior Estilo Google Profile */}
        <div className="p-3 border-t border-[#E0E3E7] bg-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-full bg-[#1A73E8] text-white flex items-center justify-center font-semibold text-xs shrink-0 font-sans">
              {user?.nombre ? getInitials(user.nombre) : 'IA'}
            </div>
            {!isCollapsed && (
              <div className="truncate text-left">
                <div className="text-xs font-semibold text-[#202124] truncate">
                  {user?.nombre || 'Usuario'}
                </div>
                <div className="text-[11px] text-[#5F6368] capitalize truncate">
                  {user?.rol || 'Investigador'}
                </div>
              </div>
            )}
          </div>
          {!isCollapsed && (
            <button
              onClick={handleLogout}
              title="Cerrar sesión"
              className="p-1.5 rounded-lg hover:bg-red-50 text-[#5F6368] hover:text-[#D93025] transition"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </aside>
    </>
  );
}
