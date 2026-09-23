/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,ts,tsx,md,mdx}'],
  theme: {
    extend: {
      colors: {
        base: '#F8F9FA',
        surface: '#FFFFFF',
        ink: {
          DEFAULT: '#202124',
          muted: '#5F6368',
          subtle: '#80868B',
        },
        accent: {
          DEFAULT: '#1A73E8',
          hover: '#1557B0',
          subtle: '#E8F0FE',
        },
        border: '#E0E3E7',
        estado: {
          borrador: '#5F6368',
          enviado: '#1A73E8',
          revision: '#1A73E8',
          observado: '#E37400',
          aprobado: '#1E8E3E',
          rechazado: '#D93025',
        },
        alarma: '#D93025',
        google: {
          blue: '#1A73E8',
          green: '#1E8E3E',
          yellow: '#E37400',
          red: '#D93025',
          gray: '#5F6368',
        },
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        'google': '0 1px 2px 0 rgba(60,64,67,0.1), 0 1px 3px 1px rgba(60,64,67,0.05)',
        'google-hover': '0 1px 3px 0 rgba(60,64,67,0.2), 0 4px 8px 3px rgba(60,64,67,0.1)',
      },
      borderRadius: {
        DEFAULT: '8px',
      },
    },
  },
  plugins: [],
}

