import type { Theme } from '../types'

export const lightTheme: Theme = {
  colors: {
    bg0: '#ffffff',
    bg1: '#f7f7f8',
    bg2: '#efefef',
    bg3: '#e4e4e7',
    accent: '#4f46e5',
    accentText: '#4338ca',
    accentSoft: 'rgba(79, 70, 229, 0.06)',
    accentMid: 'rgba(79, 70, 229, 0.12)',
    accentBorder: 'rgba(79, 70, 229, 0.2)',
    text0: '#18181b',
    text1: '#52525b',
    text2: '#a1a1aa',
    text3: '#d4d4d8',
    border: 'rgba(0, 0, 0, 0.08)',
    borderFocus: 'rgba(79, 70, 229, 0.45)',
    red: '#dc2626',
    redSoft: 'rgba(220, 38, 38, 0.06)',
    redBorder: 'rgba(220, 38, 38, 0.15)',
  },
  fonts: {
    sans: "'Inter', system-ui, -apple-system, sans-serif",
    mono: "'JetBrains Mono', 'SF Mono', 'Fira Code', monospace",
  },
  radii: {
    sm: '8px',
    md: '12px',
    lg: '20px',
    full: '9999px',
  },
  shadows: {
    chatbox: '0 8px 30px rgba(0, 0, 0, 0.1), 0 2px 8px rgba(0, 0, 0, 0.06)',
    button: '0 4px 12px rgba(0, 0, 0, 0.08)',
  },
}
