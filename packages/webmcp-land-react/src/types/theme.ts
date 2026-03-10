export interface ThemeColors {
  bg0: string
  bg1: string
  bg2: string
  bg3: string
  accent: string
  accentText: string
  accentSoft: string
  accentMid: string
  accentBorder: string
  text0: string
  text1: string
  text2: string
  text3: string
  border: string
  borderFocus: string
  red: string
  redSoft: string
  redBorder: string
}

export interface ThemeFonts {
  sans: string
  mono: string
}

export interface ThemeRadii {
  sm: string
  md: string
  lg: string
  full: string
}

export interface ThemeShadows {
  chatbox: string
  button: string
}

export interface Theme {
  colors: ThemeColors
  fonts: ThemeFonts
  radii: ThemeRadii
  shadows: ThemeShadows
}
