import { defineMiddleware } from 'astro:middleware';

export const onRequest = defineMiddleware(async (context, next) => {
  const pathname = context.url.pathname;

  // Rutas públicas y recursos estáticos
  if (
    pathname.startsWith('/login') ||
    pathname.startsWith('/api/') ||
    pathname === '/favicon.ico' ||
    pathname.startsWith('/_astro/') ||
    pathname.startsWith('/public/')
  ) {
    return next();
  }

  const token = context.cookies.get('sb-access-token')?.value;
  if (!token) {
    return context.redirect('/login');
  }

  return next();
});
