import React, { useEffect, useState } from 'react';

interface AuthGuardProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export function AuthGuard({ children, allowedRoles }: AuthGuardProps) {
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    const userString = localStorage.getItem('user');

    if (!token) {
      window.location.replace('/login');
      return;
    }

    if (allowedRoles && allowedRoles.length > 0 && userString) {
      try {
        const user = JSON.parse(userString);
        if (!allowedRoles.includes(user.rol)) {
          // Si el rol no coincide, enviarlo a su pantalla principal
          window.location.replace('/informes'); 
          return;
        }
      } catch (e) {
        window.location.replace('/login');
        return;
      }
    }

    setIsAuthorized(true);
  }, [allowedRoles]);

  if (!isAuthorized) {
    return <div className="h-full w-full bg-base" />; // Evita el destello de contenido
  }

  return <>{children}</>;
}