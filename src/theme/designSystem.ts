import { Dimensions, Platform } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// ============================================
// 4-COLUMN GRID SYSTEM
// ============================================
export const GRID = {
  columns: 4,
  margin: 16,      // Screen edge margin (2 × base unit)
  gutter: 8,       // Space between columns (1 × base unit)
  
  // Calculate column width dynamically
  getColumnWidth: () => {
    const totalGutters = (GRID.columns - 1) * GRID.gutter;
    const totalMargins = GRID.margin * 2;
    return (SCREEN_WIDTH - totalMargins - totalGutters) / GRID.columns;
  },
  
  // Get width for spanning multiple columns
  getSpanWidth: (columns: number) => {
    const columnWidth = GRID.getColumnWidth();
    const gutters = (columns - 1) * GRID.gutter;
    return columnWidth * columns + gutters;
  },
  
  // Content width (full width minus margins)
  getContentWidth: () => SCREEN_WIDTH - (GRID.margin * 2),
} as const;

// ============================================
// 8DP SPACING SYSTEM (Fixed values)
// ============================================
export const SPACING = {
  base: 8,
  
  // Spacing scale (multiples of 8)
  xxs: 4,    // 0.5x - micro spacing
  xs: 8,     // 1x - tight spacing
  sm: 12,    // 1.5x - small spacing
  md: 16,    // 2x - default spacing
  lg: 24,    // 3x - comfortable spacing
  xl: 32,    // 4x - section spacing
  xxl: 48,   // 6x - large section spacing
  xxxl: 64,  // 8x - hero spacing
  
  // Semantic spacing
  screenPadding: 16,
  cardPadding: 16,
  listItemPadding: 12,
  buttonPadding: 16,
  inputPadding: 12,
  iconMargin: 8,
  sectionGap: 24,
} as const;


// ============================================
// TYPOGRAPHY (Fixed pixel values)
// ============================================
export const TYPOGRAPHY = {
  // Font families
  fontFamily: {
    regular: Platform.select({ ios: 'System', android: 'Roboto' }),
    medium: Platform.select({ ios: 'System', android: 'Roboto-Medium' }),
    semiBold: Platform.select({ ios: 'System', android: 'Roboto-Medium' }),
    bold: Platform.select({ ios: 'System', android: 'Roboto-Bold' }),
  },
  
  // Font sizes (fixed pixels)
  fontSize: {
    xs: 10,     // Caption small
    sm: 12,     // Caption
    base: 14,   // Body small
    md: 16,     // Body
    lg: 18,     // Body large
    xl: 20,     // Heading 4
    '2xl': 24,  // Heading 3
    '3xl': 28,  // Heading 2
    '4xl': 32,  // Heading 1
    '5xl': 40,  // Display
  },
  
  // Line heights (1.4-1.6 ratio for readability)
  lineHeight: {
    tight: 1.2,
    normal: 1.4,
    relaxed: 1.6,
    loose: 1.8,
  },
  
  // Font weights
  fontWeight: {
    regular: '400' as const,
    medium: '500' as const,
    semiBold: '600' as const,
    bold: '700' as const,
  },
  
  // Letter spacing
  letterSpacing: {
    tight: -0.5,
    normal: 0,
    wide: 0.5,
    wider: 1,
  },
} as const;

// Pre-defined text styles (fixed pixels)
export const TEXT_STYLES = {
  // Display
  displayLarge: {
    fontSize: 40,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    lineHeight: 48,
    letterSpacing: TYPOGRAPHY.letterSpacing.tight,
  },
  
  // Headings
  h1: {
    fontSize: 32,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    lineHeight: 38,
  },
  h2: {
    fontSize: 28,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    lineHeight: 34,
  },
  h3: {
    fontSize: 24,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    lineHeight: 30,
  },
  h4: {
    fontSize: 20,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    lineHeight: 26,
  },
  
  // Body
  bodyLarge: {
    fontSize: 18,
    fontWeight: TYPOGRAPHY.fontWeight.regular,
    lineHeight: 26,
  },
  body: {
    fontSize: 16,
    fontWeight: TYPOGRAPHY.fontWeight.regular,
    lineHeight: 24,
  },
  bodySmall: {
    fontSize: 14,
    fontWeight: TYPOGRAPHY.fontWeight.regular,
    lineHeight: 20,
  },
  
  // Labels & Captions
  label: {
    fontSize: 14,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    lineHeight: 18,
  },
  caption: {
    fontSize: 12,
    fontWeight: TYPOGRAPHY.fontWeight.regular,
    lineHeight: 16,
  },
  captionSmall: {
    fontSize: 10,
    fontWeight: TYPOGRAPHY.fontWeight.regular,
    lineHeight: 14,
  },
  
  // Buttons
  buttonLarge: {
    fontSize: 16,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    letterSpacing: TYPOGRAPHY.letterSpacing.wide,
  },
  button: {
    fontSize: 14,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    letterSpacing: TYPOGRAPHY.letterSpacing.wide,
  },
  buttonSmall: {
    fontSize: 12,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    letterSpacing: TYPOGRAPHY.letterSpacing.wide,
  },
} as const;


// ============================================
// COMPONENT SIZES (Fixed pixels)
// ============================================
export const COMPONENT_SIZES = {
  // Touch targets (minimum 44pt for accessibility)
  touchTarget: {
    min: 44,
    sm: 36,
    md: 44,
    lg: 52,
  },
  
  // Buttons
  button: {
    height: {
      sm: 36,
      md: 44,
      lg: 52,
    },
    borderRadius: {
      sm: 8,
      md: 12,
      lg: 16,
      full: 999,
    },
    iconSize: {
      sm: 16,
      md: 20,
      lg: 24,
    },
  },
  
  // Inputs
  input: {
    height: {
      sm: 40,
      md: 48,
      lg: 56,
    },
    borderRadius: 12,
    iconSize: 20,
  },
  
  // Cards
  card: {
    borderRadius: {
      sm: 12,
      md: 16,
      lg: 20,
    },
    elevation: {
      sm: 2,
      md: 4,
      lg: 8,
    },
  },
  
  // Icons (fixed pixels)
  icon: {
    xs: 16,
    sm: 20,
    md: 24,
    lg: 32,
    xl: 48,
  },
  
  // Avatars (fixed pixels)
  avatar: {
    xs: 24,
    sm: 32,
    md: 40,
    lg: 56,
    xl: 80,
    xxl: 120,
  },
  
  // Badges
  badge: {
    sm: 16,
    md: 20,
    lg: 24,
  },
} as const;

// ============================================
// BORDER RADIUS SYSTEM (Fixed pixels)
// ============================================
export const RADIUS = {
  none: 0,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  full: 999,
} as const;

// ============================================
// SHADOW SYSTEM
// ============================================
export const SHADOWS = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
} as const;

// ============================================
// ANIMATION DURATIONS
// ============================================
export const ANIMATION = {
  duration: {
    instant: 100,
    fast: 200,
    normal: 300,
    slow: 500,
  },
  easing: {
    easeIn: 'ease-in',
    easeOut: 'ease-out',
    easeInOut: 'ease-in-out',
  },
} as const;

// Export screen dimensions for convenience
export const SCREEN = {
  width: SCREEN_WIDTH,
  height: SCREEN_HEIGHT,
} as const;
