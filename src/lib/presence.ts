import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.PUBLIC_SUPABASE_URL,
  import.meta.env.PUBLIC_SUPABASE_ANON_KEY
);

let channel: any = null;

export function joinPresence(user: { id: string; nombre: string; rol: string }) {
  if (channel) return; // ya está unido

  channel = supabase.channel('presence:instituto', {
    config: { presence: { key: user.id } },
  });

  channel.subscribe(async (status: string) => {
    if (status === 'SUBSCRIBED') {
      await channel.track({
        user_id: user.id,
        nombre: user.nombre,
        rol: user.rol,
        pantalla: window.location.pathname,
        ts: Date.now(),
      });
    }
  });

  // Actualizar la pantalla cada vez que cambia la URL
  document.addEventListener('astro:page-load', () => {
    channel?.track({
      user_id: user.id,
      nombre: user.nombre,
      rol: user.rol,
      pantalla: window.location.pathname,
      ts: Date.now(),
    });
  });
}

export function leavePresence() {
  if (channel) supabase.removeChannel(channel);
  channel = null;
}