import React, { useState, useEffect } from 'react';
import { Menu, X, Home, FileText, Folder, Activity, ShieldCheck, LogOut } from 'lucide-react';
import { getStoredUser, api } from '@/lib/api';

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<{ nombre: string; rol: string } | null>(null);

  useEffect(() => {
    const stored = getStoredUser();
    if (stored) setUser(stored as any);
  }, []);

  const handleLogout = () => {
    api.auth.logout();
    window.location.replace('/login');
  };

  const navLinks = [
    { name: 'Inicio', href: '/inicio', icon: Home, roles: ['auxiliar', 'investigador', 'revisor', 'superadmin'] },
    { name: 'Proyectos', href: '/proyectos', icon: Folder, roles: ['investigador', 'superadmin'] },
    { name: 'Informes', href: '/informes', icon: FileText, roles: ['auxiliar', 'investigador', 'revisor', 'superadmin'] },
    { name: 'Métricas', href: '/admin/dashboard', icon: Activity, roles: ['revisor', 'superadmin'] },
    { name: 'Auditoría', href: '/admin/auditoria', icon: ShieldCheck, roles: ['superadmin'] },
  ];

  const filteredLinks = navLinks.filter(link => user && link.roles.includes(user.rol));

  return (
    <nav className="fixed top-0 left-0 right-0 h-14 bg-white border-b border-border z-50 flex items-center justify-between px-4 sm:px-6">
      <div className="flex items-center gap-4">
        <button onClick={() => setIsOpen(!isOpen)} className="sm:hidden text-ink-subtle hover:text-ink">
          {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
        <div className="flex items-center gap-2 font-mono text-sm font-bold text-ink tracking-tight uppercase">
          <div className="w-6 h-6 bg-accent text-white flex items-center justify-center rounded-[3px] text-[10px]">IA</div>
          <span className="hidden sm:inline">DataReport IASA</span>
        </div>
      </div>

      {/* Desktop Menu */}
      <div className="hidden sm:flex items-center gap-6">
        {filteredLinks.map(link => (
          <a key={link.name} href={link.href} className="flex items-center gap-1.5 text-xs font-mono font-medium text-ink-subtle hover:text-accent transition-colors">
            <link.icon className="w-4 h-4" />
            {link.name}
          </a>
        ))}
      </div>

      <div className="flex items-center gap-3">
        {user && (
          <div className="hidden sm:flex items-center gap-2 text-right mr-4">
            <span className="text-xs font-semibold text-ink">{user.nombre}</span>
            <span className="text-[10px] font-mono uppercase bg-base px-1.5 py-0.5 rounded-[2px] border border-border">{user.rol}</span>
          </div>
        )}
        <button onClick={handleLogout} className="flex items-center gap-1.5 text-xs font-mono text-alarma hover:bg-red-50 px-2 py-1.5 rounded-[3px] transition-colors">
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Salir</span>
        </button>
      </div>

      {/* Mobile Dropdown */}
      {isOpen && (
        <div className="absolute top-14 left-0 right-0 bg-white border-b border-border shadow-lg sm:hidden flex flex-col p-2 space-y-1">
          {filteredLinks.map(link => (
            <a key={link.name} href={link.href} className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-ink hover:bg-base rounded-[3px]">
              <link.icon className="w-4 h-4 text-ink-subtle" />
              {link.name}
            </a>
          ))}
        </div>
      )}
    </nav>
  );
}