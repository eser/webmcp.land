import type { Theme } from '../types'
import { darkTheme } from './default'
import { lightTheme } from './light'

export function createTheme(overrides: DeepPartial<Theme>): Theme {
  return deepMerge(darkTheme as unknown as Record<string, unknown>, overrides as unknown as Record<string, unknown>) as unknown as Theme
}

export function resolveTheme(theme: 'dark' | 'light' | Theme | undefined): Theme {
  if (!theme || theme === 'dark') return darkTheme
  if (theme === 'light') return lightTheme
  return theme
}

export function applyThemeOverrides(
  theme: Theme,
  overrides: { accentColor?: string; borderRadius?: number; fontFamily?: string }
): Theme {
  const result = { ...theme, colors: { ...theme.colors }, radii: { ...theme.radii }, fonts: { ...theme.fonts } }

  if (overrides.accentColor) {
    result.colors.accent = overrides.accentColor
    result.colors.accentText = overrides.accentColor
    result.colors.accentSoft = hexToRgba(overrides.accentColor, 0.07)
    result.colors.accentMid = hexToRgba(overrides.accentColor, 0.14)
    result.colors.accentBorder = hexToRgba(overrides.accentColor, 0.2)
    result.colors.borderFocus = hexToRgba(overrides.accentColor, 0.35)
  }

  if (overrides.borderRadius !== undefined) {
    result.radii.md = `${overrides.borderRadius}px`
    result.radii.sm = `${Math.max(4, overrides.borderRadius - 4)}px`
    result.radii.lg = `${overrides.borderRadius + 10}px`
  }

  if (overrides.fontFamily) {
    result.fonts.sans = overrides.fontFamily
  }

  return result
}

export function themeToCSSVars(theme: Theme): Record<string, string> {
  return {
    '--wmcp-bg-0': theme.colors.bg0,
    '--wmcp-bg-1': theme.colors.bg1,
    '--wmcp-bg-2': theme.colors.bg2,
    '--wmcp-bg-3': theme.colors.bg3,
    '--wmcp-accent': theme.colors.accent,
    '--wmcp-accent-text': theme.colors.accentText,
    '--wmcp-accent-soft': theme.colors.accentSoft,
    '--wmcp-accent-mid': theme.colors.accentMid,
    '--wmcp-accent-border': theme.colors.accentBorder,
    '--wmcp-text-0': theme.colors.text0,
    '--wmcp-text-1': theme.colors.text1,
    '--wmcp-text-2': theme.colors.text2,
    '--wmcp-text-3': theme.colors.text3,
    '--wmcp-border': theme.colors.border,
    '--wmcp-border-focus': theme.colors.borderFocus,
    '--wmcp-red': theme.colors.red,
    '--wmcp-red-soft': theme.colors.redSoft,
    '--wmcp-red-border': theme.colors.redBorder,
    '--wmcp-font': theme.fonts.sans,
    '--wmcp-mono': theme.fonts.mono,
    '--wmcp-radius': theme.radii.md,
    '--wmcp-radius-sm': theme.radii.sm,
    '--wmcp-shadow-chatbox': theme.shadows.chatbox,
    '--wmcp-shadow-button': theme.shadows.button,
  }
}

function hexToRgba(hex: string, alpha: number): string {
  const match = hex.match(/^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i)
  if (!match) return `${hex}${Math.round(alpha * 255).toString(16).padStart(2, '0')}`
  const [, r, g, b] = match
  return `rgba(${parseInt(r, 16)}, ${parseInt(g, 16)}, ${parseInt(b, 16)}, ${alpha})`
}

type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

function deepMerge(target: Record<string, unknown>, source: Record<string, unknown>): Record<string, unknown> {
  const result = { ...target }
  for (const key of Object.keys(source)) {
    if (
      source[key] &&
      typeof source[key] === 'object' &&
      !Array.isArray(source[key]) &&
      target[key] &&
      typeof target[key] === 'object'
    ) {
      result[key] = deepMerge(
        target[key] as Record<string, unknown>,
        source[key] as Record<string, unknown>
      )
    } else {
      result[key] = source[key]
    }
  }
  return result
}
