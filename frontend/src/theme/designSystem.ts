import { Dimensions, Platform } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// ============================================
// RESPONSIVE BREAKPOINTS & DEVICE DETECTION
// ============================================
export const BREAKPOINTS = {
  xs: 320,   // Small phones
  sm: 375,   // iPhone SE, iPhone 12 mini
  md: 414,   // iPhone 11 Pro Max, most Android phones
  lg: 768,   // Small tablets
  xl: 1024,  // Large tablets
  xxl: 1200, // Desktop (if applicable)
} as const;

export const DEVICE_TYPES = {
  isSmallPhone: SCREEN_WIDTH < BREAKPOINTS.sm,
  isPhone: SCREEN_WIDTH < BREAKPOINTS.lg,
  isTablet: SCREEN_WIDTH >= BREAKPOINTS.lg && SCREEN_WIDTH < BREAKPOINTS.xl,
  isLargeTablet: SCREEN_WIDTH >= BREAKPOINTS.xl,
  isLandscape: SCREEN_WIDTH > SCREEN_HEIGHT,
} as const;

// ============================================
// RESPONSIVE SCALING FUNCTIONS
// ============================================
const baseWidth = 375; // iPhone SE/12 mini as base
const baseHeight = 667;

// Scale function for responsive sizing
export const scale = (size: number): number => {
  const scaleRatio = SCREEN_WIDTH / baseWidth;
  const newSize = size * scaleRatio;
  
  // Limit scaling to prevent too large/small sizes
  if (DEVICE_TYPES.isSmallPhone) {
    return Math.max(newSize * 0.9, size * 0.8);
  } else if (DEVICE_TYPES.isTablet) {
    return Math.min(newSize * 1.1, size * 1.3);
  } else if (DEVICE_TYPES.isLargeTablet) {
    return Math.min(newSize * 1.2, size * 1.5);
  }
  
  return newSize;
};

// Vertical scale for heights
export const verticalScale = (size: number): number => {
  const scaleRatio = SCREEN_HEIGHT / baseHeight;
  return size * scaleRatio;
};

// Moderate scale for fonts (less aggressive scaling)
export const moderateScale = (size: number, factor: number = 0.5): number => {
  return size + (scale(size) - size) * factor;
};

// ============================================
// RESPONSIVE 2-COLUMN GRID SYSTEM (PERFECT ALIGNMENT)
// ============================================
export const GRID = {
  columns: 2, // 2-column grid for perfect alignment
  
  // Responsive grid padding (horizontal margins)
  getGridPadding: () => {
    if (DEVICE_TYPES.isSmallPhone) return 12; // 12px for small phones
    if (DEVICE_TYPES.isTablet) return 16; // 16px for tablets
    if (DEVICE_TYPES.isLargeTablet) return 20; // 20px for large tablets
    return 16; // 16px for standard phones
  },
  
  // Responsive gap between grid items
  getGridGap: () => {
    if (DEVICE_TYPES.isSmallPhone) return 12; // 12px gap for small phones
    if (DEVICE_TYPES.isTablet) return 16; // 16px gap for tablets
    if (DEVICE_TYPES.isLargeTablet) return 16; // 16px gap for large tablets
    return 12; // 12px gap for standard phones
  },
  
  // Calculate grid item width for 2-column layout
  getGridItemWidth: () => {
    const padding = GRID.getGridPadding();
    const gap = GRID.getGridGap();
    const availableWidth = SCREEN_WIDTH - (padding * 2) - gap;
    return availableWidth / 2;
  },
  
  // Get responsive card dimensions as numeric values (for horizontal scrolling)
  getResponsiveCardDimensions: () => {
    if (DEVICE_TYPES.isSmallPhone) {
      return { 
        width: SCREEN_WIDTH * 0.47, // 47% of screen width
        marginHorizontal: SCREEN_WIDTH * 0.015 // 1.5% margin
      };
    }
    if (DEVICE_TYPES.isTablet) {
      return { 
        width: SCREEN_WIDTH * 0.31, // 31% of screen width
        marginHorizontal: SCREEN_WIDTH * 0.01 // 1% margin
      };
    }
    if (DEVICE_TYPES.isLargeTablet) {
      return { 
        width: SCREEN_WIDTH * 0.23, // 23% of screen width
        marginHorizontal: SCREEN_WIDTH * 0.01 // 1% margin
      };
    }
    return { 
      width: SCREEN_WIDTH * 0.47, // 47% of screen width (default)
      marginHorizontal: SCREEN_WIDTH * 0.015 // 1.5% margin
    };
  },
  
  // Responsive margins as percentage of screen width (legacy, kept for compatibility)
  getMargin: () => {
    if (DEVICE_TYPES.isSmallPhone) return SCREEN_WIDTH * 0.032; // ~3.2%
    if (DEVICE_TYPES.isTablet) return SCREEN_WIDTH * 0.031; // ~3.1%
    if (DEVICE_TYPES.isLargeTablet) return SCREEN_WIDTH * 0.031; // ~3.1%
    return SCREEN_WIDTH * 0.043; // ~4.3% for standard phones
  },
  
  // Responsive gutters as percentage of screen width (legacy, kept for compatibility)
  getGutter: () => {
    if (DEVICE_TYPES.isSmallPhone) return SCREEN_WIDTH * 0.016; // ~1.6%
    if (DEVICE_TYPES.isTablet) return SCREEN_WIDTH * 0.016; // ~1.6%
    if (DEVICE_TYPES.isLargeTablet) return SCREEN_WIDTH * 0.016; // ~1.6%
    return SCREEN_WIDTH * 0.021; // ~2.1% for standard phones
  },
  
  // Calculate column width dynamically using percentages (legacy)
  getColumnWidth: () => {
    const margin = GRID.getMargin();
    const gutter = GRID.getGutter();
    const totalGutters = (2 - 1) * gutter;
    const totalMargins = margin * 2;
    return (SCREEN_WIDTH - totalMargins - totalGutters) / 2;
  },
  
  // Get width for spanning multiple columns (legacy)
  getSpanWidth: (columns: number) => {
    const columnWidth = GRID.getColumnWidth();
    const gutter = GRID.getGutter();
    const gutters = (columns - 1) * gutter;
    return columnWidth * columns + gutters;
  },
  
  // Content width (full width minus margins) (legacy)
  getContentWidth: () => SCREEN_WIDTH - (GRID.getMargin() * 2),
  
  // Responsive column counts for different layouts (legacy)
  getResponsiveColumns: () => {
    if (DEVICE_TYPES.isSmallPhone) return 2;
    if (DEVICE_TYPES.isTablet) return 3;
    if (DEVICE_TYPES.isLargeTablet) return 4;
    return 2;
  },
  
  // Percentage-based card widths for different layouts (legacy)
  getCardWidth: (cardsPerRow: number = 2) => {
    const marginPercent = DEVICE_TYPES.isSmallPhone ? 6.4 : 8.6; // Total margin percentage
    const gapPercent = DEVICE_TYPES.isSmallPhone ? 3.2 : 4.2; // Gap between cards percentage
    const totalGaps = (cardsPerRow - 1) * gapPercent;
    return (100 - marginPercent - totalGaps) / cardsPerRow;
  },
} as const;

// ============================================
// RESPONSIVE 8DP SPACING SYSTEM
// ============================================
export const SPACING = {
  base: 8,
  
  // Responsive spacing scale (multiples of 8, scaled for device)
  get xxs() { return scale(4); },    // 0.5x - micro spacing
  get xs() { return scale(8); },     // 1x - tight spacing
  get sm() { return scale(12); },    // 1.5x - small spacing
  get md() { return scale(16); },    // 2x - default spacing
  get lg() { return scale(24); },    // 3x - comfortable spacing
  get xl() { return scale(32); },    // 4x - section spacing
  get xxl() { return scale(48); },   // 6x - large section spacing
  get xxxl() { return scale(64); },  // 8x - hero spacing
  
  // Semantic spacing (responsive)
  get screenPadding() { return GRID.getMargin(); },
  get cardPadding() { return scale(16); },
  get listItemPadding() { return scale(12); },
  get buttonPadding() { return scale(16); },
  get inputPadding() { return scale(12); },
  get iconMargin() { return scale(8); },
  get sectionGap() { return scale(24); },
  
  // Safe area aware spacing
  getSafeAreaPadding: (edge: 'top' | 'bottom' | 'left' | 'right' = 'top') => {
    const basePadding = scale(16);
    // Additional padding for devices with notches/safe areas
    if (Platform.OS === 'ios' && SCREEN_HEIGHT >= 812) { // iPhone X and newer
      switch (edge) {
        case 'top': return basePadding + 44;
        case 'bottom': return basePadding + 34;
        default: return basePadding;
      }
    }
    return basePadding;
  },
} as const;


// ============================================
// RESPONSIVE TYPOGRAPHY
// ============================================
export const TYPOGRAPHY = {
  // Font families
  fontFamily: {
    regular: Platform.select({ ios: 'System', android: 'Roboto' }),
    medium: Platform.select({ ios: 'System', android: 'Roboto-Medium' }),
    semiBold: Platform.select({ ios: 'System', android: 'Roboto-Medium' }),
    bold: Platform.select({ ios: 'System', android: 'Roboto-Bold' }),
  },
  
  // Responsive font sizes
  fontSize: {
    get xs() { return moderateScale(10); },     // Caption small
    get sm() { return moderateScale(12); },     // Caption
    get base() { return moderateScale(14); },   // Body small
    get md() { return moderateScale(16); },     // Body
    get lg() { return moderateScale(18); },     // Body large
    get xl() { return moderateScale(20); },     // Heading 4
    get '2xl'() { return moderateScale(24); },  // Heading 3
    get '3xl'() { return moderateScale(28); },  // Heading 2
    get '4xl'() { return moderateScale(32); },  // Heading 1
    get '5xl'() { return moderateScale(40); },  // Display
  },
  
  // Line heights (responsive)
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
  
  // Letter spacing (responsive)
  letterSpacing: {
    get tight() { return scale(-0.5); },
    normal: 0,
    get wide() { return scale(0.5); },
    get wider() { return scale(1); },
  },
} as const;

// Responsive text styles
export const TEXT_STYLES = {
  // Display
  get displayLarge() {
    return {
      fontSize: moderateScale(40),
      fontWeight: TYPOGRAPHY.fontWeight.bold,
      lineHeight: moderateScale(48),
      letterSpacing: TYPOGRAPHY.letterSpacing.tight,
    };
  },
  
  // Headings
  get h1() {
    return {
      fontSize: moderateScale(32),
      fontWeight: TYPOGRAPHY.fontWeight.bold,
      lineHeight: moderateScale(38),
    };
  },
  get h2() {
    return {
      fontSize: moderateScale(28),
      fontWeight: TYPOGRAPHY.fontWeight.bold,
      lineHeight: moderateScale(34),
    };
  },
  get h3() {
    return {
      fontSize: moderateScale(24),
      fontWeight: TYPOGRAPHY.fontWeight.semiBold,
      lineHeight: moderateScale(30),
    };
  },
  get h4() {
    return {
      fontSize: moderateScale(20),
      fontWeight: TYPOGRAPHY.fontWeight.semiBold,
      lineHeight: moderateScale(26),
    };
  },
  
  // Body
  get bodyLarge() {
    return {
      fontSize: moderateScale(18),
      fontWeight: TYPOGRAPHY.fontWeight.regular,
      lineHeight: moderateScale(26),
    };
  },
  get body() {
    return {
      fontSize: moderateScale(16),
      fontWeight: TYPOGRAPHY.fontWeight.regular,
      lineHeight: moderateScale(24),
    };
  },
  get bodySmall() {
    return {
      fontSize: moderateScale(14),
      fontWeight: TYPOGRAPHY.fontWeight.regular,
      lineHeight: moderateScale(20),
    };
  },
  
  // Labels & Captions
  get label() {
    return {
      fontSize: moderateScale(14),
      fontWeight: TYPOGRAPHY.fontWeight.medium,
      lineHeight: moderateScale(18),
    };
  },
  get caption() {
    return {
      fontSize: moderateScale(12),
      fontWeight: TYPOGRAPHY.fontWeight.regular,
      lineHeight: moderateScale(16),
    };
  },
  get captionSmall() {
    return {
      fontSize: moderateScale(10),
      fontWeight: TYPOGRAPHY.fontWeight.regular,
      lineHeight: moderateScale(14),
    };
  },
  
  // Buttons
  get buttonLarge() {
    return {
      fontSize: moderateScale(16),
      fontWeight: TYPOGRAPHY.fontWeight.semiBold,
      letterSpacing: TYPOGRAPHY.letterSpacing.wide,
    };
  },
  get button() {
    return {
      fontSize: moderateScale(14),
      fontWeight: TYPOGRAPHY.fontWeight.semiBold,
      letterSpacing: TYPOGRAPHY.letterSpacing.wide,
    };
  },
  get buttonSmall() {
    return {
      fontSize: moderateScale(12),
      fontWeight: TYPOGRAPHY.fontWeight.semiBold,
      letterSpacing: TYPOGRAPHY.letterSpacing.wide,
    };
  },
} as const;


// ============================================
// RESPONSIVE COMPONENT SIZES
// ============================================
export const COMPONENT_SIZES = {
  // Touch targets (responsive, minimum 44pt for accessibility)
  touchTarget: {
    get min() { return Math.max(scale(44), 44); }, // Never go below 44pt
    get sm() { return scale(36); },
    get md() { return scale(44); },
    get lg() { return scale(52); },
  },
  
  // Buttons (responsive)
  button: {
    height: {
      get sm() { return scale(36); },
      get md() { return scale(44); },
      get lg() { return scale(52); },
    },
    borderRadius: {
      get sm() { return scale(8); },
      get md() { return scale(12); },
      get lg() { return scale(16); },
      full: 999,
    },
    iconSize: {
      get sm() { return scale(16); },
      get md() { return scale(20); },
      get lg() { return scale(24); },
    },
  },
  
  // Inputs (responsive)
  input: {
    height: {
      get sm() { return scale(40); },
      get md() { return scale(48); },
      get lg() { return scale(56); },
    },
    get borderRadius() { return scale(12); },
    get iconSize() { return scale(20); },
  },
  
  // Cards (responsive)
  card: {
    borderRadius: {
      get sm() { return scale(12); },
      get md() { return scale(16); },
      get lg() { return scale(20); },
    },
    elevation: {
      sm: 2,
      md: 4,
      lg: 8,
    },
  },
  
  // Icons (responsive)
  icon: {
    get xs() { return scale(16); },
    get sm() { return scale(20); },
    get md() { return scale(24); },
    get lg() { return scale(32); },
    get xl() { return scale(48); },
  },
  
  // Avatars (responsive)
  avatar: {
    get xs() { return scale(24); },
    get sm() { return scale(32); },
    get md() { return scale(40); },
    get lg() { return scale(56); },
    get xl() { return scale(80); },
    get xxl() { return scale(120); },
  },
  
  // Badges (responsive)
  badge: {
    get sm() { return scale(16); },
    get md() { return scale(20); },
    get lg() { return scale(24); },
  },
} as const;

// ============================================
// RESPONSIVE BORDER RADIUS SYSTEM
// ============================================
export const RADIUS = {
  none: 0,
  get xs() { return scale(4); },
  get sm() { return scale(8); },
  get md() { return scale(12); },
  get lg() { return scale(16); },
  get xl() { return scale(20); },
  get xxl() { return scale(24); },
  full: 999,
} as const;

// ============================================
// RESPONSIVE SHADOW SYSTEM WITH LIGHT MODE ENHANCEMENTS
// ============================================

// Light mode shadow multipliers for better visibility
const LIGHT_MODE_SHADOW_MULTIPLIERS = {
  opacity: 3.0,    // 3x current opacity (0.05 → 0.15)
  radius: 1.2,     // 20% larger blur radius
  offset: 1.1,     // 10% larger offset
} as const;

// Enhanced shadows for light mode
const ENHANCED_SHADOWS = {
  light: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: scale(2) },
      shadowOpacity: 0.12,  // vs current 0.05
      shadowRadius: scale(3),      // vs current 2
      elevation: 2,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: scale(3) },
      shadowOpacity: 0.18,  // vs current 0.08
      shadowRadius: scale(6),      // vs current 4
      elevation: 4,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: scale(6) },
      shadowOpacity: 0.25,  // vs current 0.1
      shadowRadius: scale(12),     // vs current 8
      elevation: 8,
    },
    xl: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: scale(8) },
      shadowOpacity: 0.3,   // vs current 0.12
      shadowRadius: scale(16),     // vs current 16
      elevation: 12,
    },
  },
} as const;

// Theme-aware shadow getter
export const getEnhancedShadow = (level: 'sm' | 'md' | 'lg' | 'xl', isDark: boolean) => {
  if (isDark) {
    return SHADOWS[level]; // Use existing dark mode shadows
  }
  return ENHANCED_SHADOWS.light[level]; // Use enhanced light mode shadows
};

export const SHADOWS = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  get sm() {
    return {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: scale(1) },
      shadowOpacity: 0.05,
      shadowRadius: scale(2),
      elevation: 1,
    };
  },
  get md() {
    return {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: scale(2) },
      shadowOpacity: 0.08,
      shadowRadius: scale(4),
      elevation: 2,
    };
  },
  get lg() {
    return {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: scale(4) },
      shadowOpacity: 0.1,
      shadowRadius: scale(8),
      elevation: 4,
    };
  },
  get xl() {
    return {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: scale(8) },
      shadowOpacity: 0.12,
      shadowRadius: scale(16),
      elevation: 8,
    };
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

// ============================================
// RESPONSIVE LAYOUT UTILITIES
// ============================================
export const LAYOUT = {
  // Flexbox helpers
  flex: {
    center: {
      flex: 1,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
    },
    row: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
    },
    rowBetween: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      alignItems: 'center' as const,
    },
    rowAround: {
      flexDirection: 'row' as const,
      justifyContent: 'space-around' as const,
      alignItems: 'center' as const,
    },
    column: {
      flexDirection: 'column' as const,
    },
  },
  
  // Safe area helpers
  safeArea: {
    // Get safe area padding for different edges
    getPadding: (edge: 'top' | 'bottom' | 'left' | 'right' = 'top') => {
      const basePadding = SPACING.screenPadding;
      // Additional padding for devices with notches/safe areas
      if (Platform.OS === 'ios' && SCREEN_HEIGHT >= 812) { // iPhone X and newer
        switch (edge) {
          case 'top': return basePadding + scale(44);
          case 'bottom': return basePadding + scale(34);
          default: return basePadding;
        }
      }
      return basePadding;
    },
    
    // Container with safe area padding
    container: {
      flex: 1,
      paddingTop: SPACING.getSafeAreaPadding('top'),
      paddingBottom: SPACING.getSafeAreaPadding('bottom'),
      paddingHorizontal: SPACING.screenPadding,
    },
    
    // Header with safe area top padding
    header: {
      paddingTop: SPACING.getSafeAreaPadding('top'),
      paddingHorizontal: SPACING.screenPadding,
    },
  },
  
  // Responsive breakpoint helpers
  responsive: {
    // Get responsive value based on screen size
    getValue: <T>(values: {
      xs?: T;
      sm?: T;
      md?: T;
      lg?: T;
      xl?: T;
      default: T;
    }): T => {
      if (DEVICE_TYPES.isSmallPhone && values.xs !== undefined) return values.xs;
      if (SCREEN_WIDTH < BREAKPOINTS.md && values.sm !== undefined) return values.sm;
      if (SCREEN_WIDTH < BREAKPOINTS.lg && values.md !== undefined) return values.md;
      if (DEVICE_TYPES.isTablet && values.lg !== undefined) return values.lg;
      if (DEVICE_TYPES.isLargeTablet && values.xl !== undefined) return values.xl;
      return values.default;
    },
    
    // Get responsive columns for grids
    getColumns: () => {
      if (DEVICE_TYPES.isSmallPhone) return 1;
      if (DEVICE_TYPES.isPhone) return 2;
      if (DEVICE_TYPES.isTablet) return 3;
      if (DEVICE_TYPES.isLargeTablet) return 4;
      return 2;
    },
    
    // Get responsive font scale
    getFontScale: () => {
      if (DEVICE_TYPES.isSmallPhone) return 0.9;
      if (DEVICE_TYPES.isTablet) return 1.1;
      if (DEVICE_TYPES.isLargeTablet) return 1.2;
      return 1.0;
    },
  },
} as const;
