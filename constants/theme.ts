// Design tokens & constants for Nails by Mamta mobile app
export const Colors = {
  primary: '#f56db8',       // oklch(0.62 0.17 350) – vibrant rose pink
  primaryLight: '#fce6f1',  // oklch(0.90 0.05 350) – light rose (secondary)
  primaryDark: '#7b4f62',   // oklch(0.55 0.06 350) – deep warm rose (muted-foreground)

  // Background / surfaces
  background: '#fbe7f1',    // oklch(0.96 0.03 350) – soft blossom pink
  surface: '#ffffff',       // matches web card/popover = white
  surfaceAlt: '#f7dde9',    // oklch(0.93 0.04 350) – soft pink-grey (muted)

  // Text
  charcoal: '#3a252d',      // oklch(0.25 0.04 350) – dark warm rose-grey (foreground)
  textPrimary: '#3a252d',   // same as foreground
  textSecondary: '#7b4f62', // slightly lighter than primaryDark
  textMuted: '#a3738a',     // softer variation between muted-foreground & border

  // UI chrome
  border: '#f0e6ea',        // oklch(0.922 0 0) – very light neutral
  success: '#4CAF7D',
  warning: '#F5A623',
  error: '#E05252',

  white: '#ffffff',
  black: '#000000',
}

export const Fonts = {
  heading: 'PlayfairDisplay_700Bold',
  headingRegular: 'PlayfairDisplay_400Regular',
  body: 'Inter_400Regular',
  bodyMedium: 'Inter_500Medium',
  bodySemibold: 'Inter_600SemiBold',
}

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
}

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
}

export const API_BASE = 'https://mamatadhakal.com.np'
