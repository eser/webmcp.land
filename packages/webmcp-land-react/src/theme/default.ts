import type { Theme } from '../types'

export const darkTheme: Theme = {
  colors: {
    bg0: '#0a0a0b',
    bg1: '#0f0f11',
    bg2: '#161618',
    bg3: '#1e1e22',
    accent: '#6366f1',
    accentText: '#818cf8',
    accentSoft: 'rgba(99, 102, 241, 0.08)',
    accentMid: 'rgba(99, 102, 241, 0.15)',
    accentBorder: 'rgba(99, 102, 241, 0.25)',
    text0: '#ededf0',
    text1: '#a8a8b3',
    text2: '#62626d',
    text3: '#3e3e47',
    border: 'rgba(255, 255, 255, 0.07)',
    borderFocus: 'rgba(99, 102, 241, 0.45)',
    red: '#ef4444',
    redSoft: 'rgba(239, 68, 68, 0.09)',
    redBorder: 'rgba(239, 68, 68, 0.2)',
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
    chatbox: '0 8px 30px rgba(0, 0, 0, 0.35), 0 2px 8px rgba(0, 0, 0, 0.2)',
    button: '0 4px 16px rgba(0, 0, 0, 0.3)',
  },
}
