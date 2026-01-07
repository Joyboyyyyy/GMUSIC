import { Dimensions, PixelRatio, Platform } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// ============================================
// DEVICE BREAKPOINTS
// ============================================
export const BREAKPOINTS = {
  smallPhone: 320,   // iPhone SE, small Android
  phone: 375,        // iPhone 12/13/14
  largePhone: 414,   // iPhone Plus/Max
  tablet: 768,       // iPad Mini
} as const;

export const getDeviceType = (): 'smallPhone' | 'phone' | 'largePhone' | 'tablet' => {
  if (SCREEN_WIDTH >= BREAKPOINTS.tablet) return 'tablet';
  if (SCREEN_WIDTH >= BREAKPOINTS.largePhone) return 'largePhone';
  if (SCREEN_WIDTH >= BREAKPOINTS.phone) return 'phone';
  return 'smallPhone';
};

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
// 8DP SPACING SYSTEM
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
// SCALABLE TYPOGRAPHY
// ============================================
const fontScale = PixelRatio.getFontScale();
const pixelRatio = PixelRatio.get();

// Normalize font size based on screen width and pixel density
const normalize = (size: number): number => {
  const scale = SCREEN_WIDTH / 375; // Base on iPhone 12/13 width
  const newSize = size * scale;
  
  if (Platform.OS === 'ios') {
    return Math.round(PixelRatio.roundToNearestPixel(newSize));
  }
  return Math.round(PixelRatio.roundToNearestPixel(newSize)) - 2;
};

// Responsive font size that respects user's accessibility settings
const scaledFontSize = (size: number): number => {
  const scaled = normalize(size);
  // Clamp to prevent extreme scaling
  const minScale = 0.85;
  const maxScale = 1.3;
  const clampedScale = Math.min(Math.max(fontScale, minScale), maxScale);
  return Math.round(scaled * clampedScale);
};

export const TYPOGRAPHY = {
  // Font families
  fontFamily: {
    regular: Platform.select({ ios: 'System', android: 'Roboto' }),
    medium: Platform.select({ ios: 'System', android: 'Roboto-Medium' }),
    semiBold: Platform.select({ ios: 'System', android: 'Roboto-Medium' }),
    bold: Platform.select({ ios: 'System', android: 'Roboto-Bold' }),
  },
  
  // Font sizes (scalable)
  fontSize: {
    xs: scaledFontSize(10),     // Caption small
    sm: scaledFontSize(12),     // Caption
    base: scaledFontSize(14),   // Body small
    md: scaledFontSize(16),     // Body
    lg: scaledFontSize(18),     // Body large
    xl: scaledFontSize(20),     // Heading 4
    '2xl': scaledFontSize(24),  // Heading 3
    '3xl': scaledFontSize(28),  // Heading 2
    '4xl': scaledFontSize(32),  // Heading 1
    '5xl': scaledFontSize(40),  // Display
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

// Pre-defined text styles
export const TEXT_STYLES = {
  // Display
  displayLarge: {
    fontSize: TYPOGRAPHY.fontSize['5xl'],
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    lineHeight: TYPOGRAPHY.fontSize['5xl'] * TYPOGRAPHY.lineHeight.tight,
    letterSpacing: TYPOGRAPHY.letterSpacing.tight,
  },
  
  // Headings
  h1: {
    fontSize: TYPOGRAPHY.fontSize['4xl'],
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    lineHeight: TYPOGRAPHY.fontSize['4xl'] * TYPOGRAPHY.lineHeight.tight,
  },
  h2: {
    fontSize: TYPOGRAPHY.fontSize['3xl'],
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    lineHeight: TYPOGRAPHY.fontSize['3xl'] * TYPOGRAPHY.lineHeight.tight,
  },
  h3: {
    fontSize: TYPOGRAPHY.fontSize['2xl'],
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    lineHeight: TYPOGRAPHY.fontSize['2xl'] * TYPOGRAPHY.lineHeight.normal,
  },
  h4: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    lineHeight: TYPOGRAPHY.fontSize.xl * TYPOGRAPHY.lineHeight.normal,
  },
  
  // Body
  bodyLarge: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.regular,
    lineHeight: TYPOGRAPHY.fontSize.lg * TYPOGRAPHY.lineHeight.relaxed,
  },
  body: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.regular,
    lineHeight: TYPOGRAPHY.fontSize.md * TYPOGRAPHY.lineHeight.relaxed,
  },
  bodySmall: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.regular,
    lineHeight: TYPOGRAPHY.fontSize.base * TYPOGRAPHY.lineHeight.relaxed,
  },
  
  // Labels & Captions
  label: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    lineHeight: TYPOGRAPHY.fontSize.base * TYPOGRAPHY.lineHeight.normal,
  },
  caption: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.regular,
    lineHeight: TYPOGRAPHY.fontSize.sm * TYPOGRAPHY.lineHeight.normal,
  },
  captionSmall: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.regular,
    lineHeight: TYPOGRAPHY.fontSize.xs * TYPOGRAPHY.lineHeight.normal,
  },
  
  // Buttons
  buttonLarge: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    letterSpacing: TYPOGRAPHY.letterSpacing.wide,
  },
  button: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    letterSpacing: TYPOGRAPHY.letterSpacing.wide,
  },
  buttonSmall: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    letterSpacing: TYPOGRAPHY.letterSpacing.wide,
  },
} as const;


// ============================================
// ADAPTIVE COMPONENT SIZES
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
  
  // Icons
  icon: {
    xs: 16,
    sm: 20,
    md: 24,
    lg: 32,
    xl: 48,
  },
  
  // Avatars
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
// BORDER RADIUS SYSTEM
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
// RESPONSIVE HELPERS
// ============================================
export const responsive = {
  // Get value based on device type
  value: <T>(values: { smallPhone?: T; phone?: T; largePhone?: T; tablet?: T; default: T }): T => {
    const device = getDeviceType();
    return values[device] ?? values.default;
  },
  
  // Scale value based on screen width
  scale: (value: number, factor: number = 1): number => {
    const scale = SCREEN_WIDTH / 375;
    return Math.round(value * scale * factor);
  },
  
  // Percentage of screen width
  wp: (percentage: number): number => {
    return Math.round((percentage / 100) * SCREEN_WIDTH);
  },
  
  // Percentage of screen height
  hp: (percentage: number): number => {
    return Math.round((percentage / 100) * SCREEN_HEIGHT);
  },
  
  // Check if small screen
  isSmallScreen: (): boolean => SCREEN_WIDTH < BREAKPOINTS.phone,
  
  // Check if large screen
  isLargeScreen: (): boolean => SCREEN_WIDTH >= BREAKPOINTS.largePhone,
};

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
  pixelRatio,
  fontScale,
} as const;
