/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,ts,tsx,md,mdx}'],
  theme: {
    extend: {
      colors: {
        base: '#F5F6F4',
        ink: {
          DEFAULT: '#1E2A2E',
          muted: '#4A5B60',
          subtle: '#6B7E84',
        },
        accent: {
          DEFAULT: '#136F63',
          hover: '#0F574E',
          subtle: '#E6F1F0',
        },
        border: '#A9B4B3',
        estado: {
          recibido: '#8A9694',
          revision: '#136F63',
          observado: '#C97A2B',
          corregido: '#3B6EA5',
          aprobado: '#3E7D53',
          rechazado: '#C4432B',
        },
        alarma: '#C4432B', // solo para celdas de datos fuera de rango
      },
      fontFamily: {
        sans: ['"IBM Plex Sans"', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
      borderRadius: {
        DEFAULT: '4px',
      },
    },
  },
  plugins: [],
}
