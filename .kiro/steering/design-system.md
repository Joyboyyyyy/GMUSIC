# Design System Guidelines

## Overview
This app follows a systemized mobile UI with a 4-column grid, 8dp spacing system, scalable typography, and adaptive components.

## 4-Column Grid System
- **Columns**: 4
- **Margin**: 16dp (screen edges)
- **Gutter**: 8dp (between columns)
- Use `GRID.getColumnWidth()` for single column width
- Use `GRID.getSpanWidth(n)` for spanning n columns

## 8dp Spacing System
All spacing uses multiples of 8dp:
- `xxs`: 4dp (0.5x)
- `xs`: 8dp (1x)
- `sm`: 12dp (1.5x)
- `md`: 16dp (2x) - default
- `lg`: 24dp (3x)
- `xl`: 32dp (4x)
- `xxl`: 48dp (6x)
- `xxxl`: 64dp (8x)

## Typography Scale
Scalable font sizes that adapt to screen size and user accessibility settings:
- `xs`: 10dp - Caption small
- `sm`: 12dp - Caption
- `base`: 14dp - Body small
- `md`: 16dp - Body
- `lg`: 18dp - Body large
- `xl`: 20dp - Heading 4
- `2xl`: 24dp - Heading 3
- `3xl`: 28dp - Heading 2
- `4xl`: 32dp - Heading 1
- `5xl`: 40dp - Display

## Component Sizes
### Buttons
- Small: 36dp height
- Medium: 44dp height (default)
- Large: 52dp height

### Inputs
- Small: 40dp height
- Medium: 48dp height (default)
- Large: 56dp height

### Touch Targets
- Minimum: 44dp (accessibility requirement)

## Border Radius
- `xs`: 4dp
- `sm`: 8dp
- `md`: 12dp (default for cards)
- `lg`: 16dp
- `xl`: 20dp
- `full`: 999dp (pills)

## Usage
```tsx
import { SPACING, GRID, TYPOGRAPHY, COMPONENT_SIZES } from '../theme/designSystem';
import { Button, Card, Text, Input, Container, Row, Spacer } from '../components/ui';
```

## Responsive Helpers
```tsx
import { responsive } from '../theme/designSystem';

// Get value based on device type
const padding = responsive.value({
  smallPhone: 12,
  phone: 16,
  largePhone: 20,
  default: 16,
});

// Scale value based on screen width
const iconSize = responsive.scale(24);

// Percentage of screen
const width = responsive.wp(50); // 50% of screen width
```
