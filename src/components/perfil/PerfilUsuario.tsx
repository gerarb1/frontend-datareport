import React, { useEffect, useState } from 'react';
import { 
  User, Mail, Shield, FileText, 
  FolderPlus, FileUp, CheckCircle, Activity 
} from 'lucide-react';

interface UserData {
  id: string;
  email: string;
  nombre: string;
  rol: 'auxiliar' | 'investigador' | 'revisor' | 'superadmin';
}

export function PerfilUsuario() {
  const [user, setUser] = useState<UserData | null>(null);

  useEffect(() => {
    try {
      const userString = localStorage.getItem('user');
      if (userString) {
        setUser(JSON.parse(userString));
      } else {
        window.location.replace('/login');
      }
    } catch {
      window.location.replace('/login');
    }
  }, []);

  if (!user) {
    return <div className="p-4 font-mono text-xs text-ink-muted">Cargando perfil...</div>;
  }

  // Definición de opciones operativas por rol basadas en los microservicios
  const opcionesPorRol = {
    auxiliar: [
      { titulo: 'Crear Informe', ruta: '/informes/nuevo', icono: FileText, desc: 'Generar un nuevo informe en estado borrador.' },
    ],
    investigador: [
      { titulo: 'Crear Proyecto', ruta: '/proyectos/nuevo', icono: FolderPlus, desc: 'Registrar un nuevo proyecto de investigación.' },
      { titulo: 'Mis Informes', ruta: '/informes', icono: FileText, desc: 'Gestionar informes y enviarlos a revisión.' },
      { titulo: 'Subir Versiones', ruta: '/informes/versiones', icono: FileUp, desc: 'Cargar documentos directos a Storage R2.' },
    ],
    revisor: [
      { titulo: 'Revisiones Pendientes', ruta: '/informes/revision', icono: CheckCircle, desc: 'Examinar documentos y emitir dictámenes.' },
      { titulo: 'Métricas', ruta: '/admin/dashboard', icono: Activity, desc: 'Ver KPIs de revisiones y estado de informes.' },
    ],
    superadmin: [
      { titulo: 'Auditoría Global', ruta: '/admin/auditoria', icono: Shield, desc: 'Registro de transiciones y logs del sistema.' },
      { titulo: 'Gestión de Roles', ruta: '/admin/usuarios', icono: User, desc: 'Cambiar roles de los usuarios registrados.' },
    ]
  };

  const opciones = opcionesPorRol[user.rol] || opcionesPorRol.auxiliar;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white p-6 border border-border rounded-[3px] flex items-center gap-4">
        <div className="h-16 w-16 bg-base border border-border rounded-full flex items-center justify-center">
          <User className="h-8 w-8 text-ink-muted" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-ink">{user.nombre}</h1>
          <div className="flex items-center gap-4 mt-2 font-mono text-xs text-ink-subtle">
            <span className="flex items-center gap-1"><Mail className="h-3 w-3" /> {user.email}</span>
            <span className="flex items-center gap-1 uppercase bg-[#F0F2F0] px-2 py-0.5 border border-border rounded-[3px]">
              <Shield className="h-3 w-3" /> {user.rol}
            </span>
          </div>
        </div>
      </div>

      <h2 className="text-sm font-semibold text-ink font-mono uppercase tracking-wider mb-4">
        Opciones Disponibles
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {opciones.map((opcion, index) => {
          const Icono = opcion.icono;
          return (
            <a 
              key={index} 
              href={opcion.ruta}
              className="block p-5 bg-white border border-border hover:border-accent transition-colors rounded-[3px] group"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-base rounded-[3px] group-hover:bg-accent/10 group-hover:text-accent transition-colors">
                  <Icono className="h-5 w-5" />
                </div>
                <h3 className="text-sm font-semibold text-ink">{opcion.titulo}</h3>
              </div>
              <p className="text-xs text-ink-muted">{opcion.desc}</p>
            </a>
          );
        })}
      </div>
    </div>
  );
}