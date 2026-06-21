/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    container: { center: true, padding: '1.5rem', screens: { '2xl': '1400px' } },
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: { DEFAULT: 'hsl(var(--primary))', foreground: 'hsl(var(--primary-foreground))' },
        secondary: { DEFAULT: 'hsl(var(--secondary))', foreground: 'hsl(var(--secondary-foreground))' },
        destructive: { DEFAULT: 'hsl(var(--destructive))', foreground: 'hsl(var(--destructive-foreground))' },
        muted: { DEFAULT: 'hsl(var(--muted))', foreground: 'hsl(var(--muted-foreground))' },
        accent: { DEFAULT: 'hsl(var(--accent))', foreground: 'hsl(var(--accent-foreground))' },
        card: { DEFAULT: 'hsl(var(--card))', foreground: 'hsl(var(--card-foreground))' },
        success: { DEFAULT: 'hsl(var(--success))', foreground: 'hsl(var(--success-foreground))' },
      },
      borderRadius: { lg: 'var(--radius)', md: 'calc(var(--radius) - 4px)', sm: 'calc(var(--radius) - 8px)' },
      backgroundImage: {
        'mesh-ucp':
          'radial-gradient(at 20% 20%, hsla(345,72%,42%,0.28) 0px, transparent 50%),' +
          'radial-gradient(at 80% 10%, hsla(42,92%,52%,0.16) 0px, transparent 50%),' +
          'radial-gradient(at 70% 80%, hsla(345,70%,38%,0.24) 0px, transparent 50%),' +
          'radial-gradient(at 10% 75%, hsla(222,47%,30%,0.22) 0px, transparent 50%)',
      },
      keyframes: {
        'accordion-down': { from: { height: '0' }, to: { height: 'var(--radix-accordion-content-height)' } },
        'pulse-ring': { '0%,100%': { opacity: '1' }, '50%': { opacity: '0.45' } },
        float: {
          '0%,100%': { transform: 'translateY(0) translateX(0) scale(1)' },
          '33%': { transform: 'translateY(-30px) translateX(20px) scale(1.05)' },
          '66%': { transform: 'translateY(20px) translateX(-15px) scale(0.97)' },
        },
        'blob-drift': {
          '0%,100%': { transform: 'translate(0,0) scale(1)' },
          '50%': { transform: 'translate(40px,-30px) scale(1.15)' },
        },
        'gradient-pan': {
          '0%,100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        'glow-pulse': {
          '0%,100%': { boxShadow: '0 0 24px -6px rgba(190,30,60,0.4)' },
          '50%': { boxShadow: '0 0 44px 0px rgba(190,30,60,0.65)' },
        },
        'fade-up': { from: { opacity: '0', transform: 'translateY(16px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        shimmer: { '100%': { transform: 'translateX(100%)' } },
      },
      animation: {
        'pulse-ring': 'pulse-ring 1.4s ease-in-out infinite',
        float: 'float 14s ease-in-out infinite',
        'blob-drift': 'blob-drift 18s ease-in-out infinite',
        'gradient-pan': 'gradient-pan 6s ease infinite',
        'glow-pulse': 'glow-pulse 3s ease-in-out infinite',
        'fade-up': 'fade-up 0.5s ease both',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
