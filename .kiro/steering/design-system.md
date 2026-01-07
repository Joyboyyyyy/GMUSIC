# Design System Guidelines

## Overview
This app follows a systemized mobile UI with a 4-column grid, 8dp spacing system, fixed typography, and consistent components.

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

## Typography Scale (Fixed Pixels)
- `xs`: 10px - Caption small
- `sm`: 12px - Caption
- `base`: 14px - Body small
- `md`: 16px - Body
- `lg`: 18px - Body large
- `xl`: 20px - Heading 4
- `2xl`: 24px - Heading 3
- `3xl`: 28px - Heading 2
- `4xl`: 32px - Heading 1
- `5xl`: 40px - Display

## Component Sizes (Fixed Pixels)
### Buttons
- Small: 36px height
- Medium: 44px height (default)
- Large: 52px height

### Inputs
- Small: 40px height
- Medium: 48px height (default)
- Large: 56px height

### Touch Targets
- Minimum: 44px (accessibility requirement)

### Icons
- xs: 16px
- sm: 20px
- md: 24px
- lg: 32px
- xl: 48px

### Avatars
- xs: 24px
- sm: 32px
- md: 40px
- lg: 56px
- xl: 80px
- xxl: 120px

## Border Radius (Fixed Pixels)
- `xs`: 4px
- `sm`: 8px
- `md`: 12px (default for cards)
- `lg`: 16px
- `xl`: 20px
- `full`: 999px (pills)

## Usage
```tsx
import { SPACING, GRID, TYPOGRAPHY, COMPONENT_SIZES, RADIUS, SHADOWS } from '../theme/designSystem';
import { Button, Card, Text, Input, Container, Row, Spacer } from '../components/ui';
```
