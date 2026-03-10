import { useMemo, useContext } from 'react'
import type { Theme } from '../types'
import { resolveTheme, applyThemeOverrides, themeToCSSVars } from '../theme/utils'
import { WebMCPContext } from '../context/WebMCPProvider'

export interface UseThemeOptions {
  theme?: 'dark' | 'light' | Theme
  accentColor?: string
  borderRadius?: number
  fontFamily?: string
}

export function useThemeFromOptions(options: UseThemeOptions = {}) {
  const { theme: themeOption, accentColor, borderRadius, fontFamily } = options

  const resolvedTheme = useMemo(() => {
    let theme = resolveTheme(themeOption)
    if (accentColor || borderRadius !== undefined || fontFamily) {
      theme = applyThemeOverrides(theme, { accentColor, borderRadius, fontFamily })
    }
    return theme
  }, [themeOption, accentColor, borderRadius, fontFamily])

  const cssVars = useMemo(() => themeToCSSVars(resolvedTheme), [resolvedTheme])

  return { theme: resolvedTheme, cssVars }
}

export function useTheme(): Theme {
  const context = useContext(WebMCPContext)
  if (!context) {
    return resolveTheme('dark')
  }
  return (context as unknown as { theme: Theme }).theme
}
