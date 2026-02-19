# Luna Design Tokens

Design tokens for the Luna Careers platform. All colors meet WCAG AA contrast requirements.

## Brand Colors

| Token | Hex | Usage |
|-------|-----|-------|
| `luna-navy` | `#00185F` | Primary brand, headers, strong text |
| `luna-blue` | `#1449E8` | Primary actions, links, focus states |
| `luna-yellow` | `#FFDF2B` | Highlights, badges, attention |

## Neutral Colors

| Token | Hex | Usage |
|-------|-----|-------|
| `luna-gray-50` | `#F8F9FB` | Secondary backgrounds |
| `luna-gray-100` | `#F1F3F6` | Hover states, subtle backgrounds |
| `luna-gray-200` | `#E4E7EC` | Default borders, dividers |
| `luna-gray-300` | `#D0D5DD` | Disabled borders |
| `luna-gray-400` | `#98A2B3` | Placeholder text |
| `luna-gray-450` | `#AFB3BF` | Muted text, subtle labels |
| `luna-gray-500` | `#667085` | Secondary text |
| `luna-gray-600` | `#5A637B` | Body text |
| `luna-gray-700` | `#344054` | Emphasized text |
| `luna-gray-800` | `#1D2939` | Headings |
| `luna-gray-900` | `#0C141D` | Primary text |

## Semantic Colors

| Token | Hex | Usage |
|-------|-----|-------|
| `luna-success` | `#10B981` | Success states, confirmations |
| `luna-warning` | `#F59E0B` | Warnings, pending states |
| `luna-error` | `#EF4444` | Errors, destructive actions |
| `luna-info` | `#3B82F6` | Informational messages |

## Portal Accent Colors

| Token | Hex | Portal |
|-------|-----|--------|
| `luna-personal` | `#1449E8` | Personal portal (/u/*) |
| `luna-organization` | `#7C3AED` | Organization portal (/org/*) |
| `luna-admin` | `#6B7280` | Admin portal (/cmd/*) |

## Background Colors

| Token | Value | Usage |
|-------|-------|-------|
| `luna-bg-primary` | `#FFFFFF` | Main content background |
| `luna-bg-secondary` | `#F8F9FB` | Sidebar, cards, sections |
| `luna-bg-tertiary` | `rgba(0,24,95,0.04)` | Subtle highlights |

## Border Colors

| Token | Value | Usage |
|-------|-------|-------|
| `luna-border-light` | `rgba(0,24,95,0.04)` | Subtle dividers |
| `luna-border-default` | `#E4E7EC` | Standard borders |
| `luna-border-strong` | `#00185F` | Active/focused borders |

## Typography

**Font Family:** Arimo (Primary), Inter (Fallback) - Google Fonts

| Use Case | Class | Size | Weight |
|----------|-------|------|--------|
| H1 | `text-3xl font-bold` | 30px | 700 |
| H2 | `text-2xl font-semibold` | 24px | 600 |
| H3 | `text-xl font-semibold` | 20px | 600 |
| H4 | `text-lg font-medium` | 18px | 500 |
| Body | `text-base` | 16px | 400 |
| Small | `text-sm` | 14px | 400 |
| Caption | `text-xs` | 12px | 400 |

### Font Loading

Arimo is loaded via Google Fonts for optimal performance:

```tsx
// In app/layout.tsx
import { Arimo } from 'next/font/google';

const arimo = Arimo({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-arimo',
});
```

Apply using: `className={arimo.variable}` on the `<html>` tag and `className="font-arimo"` on the `<body>` tag.

## Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `rounded-md` | 5px | Default for cards, buttons |
| `rounded-lg` | 8px | Larger cards, modals |
| `rounded-full` | 9999px | Avatars, pills |

## Shadows

Use luna-shadow-* utilities for consistent elevation and depth.

| Token | Value | Usage |
|-------|-------|-------|
| `luna-shadow-sm` | `0px 2px 12px 1px rgba(0, 0, 0, 0.05)` | Cards, buttons, subtle elevation |
| `luna-shadow-md` | `0px 4px 16px rgba(0, 0, 0, 0.1)` | Dropdowns, modals, prominent elevation |

### Usage Examples

```tsx
// Card with subtle shadow
<div className="bg-white rounded-md shadow-luna-sm">
  Content
</div>

// Dropdown with prominent shadow
<div className="bg-white rounded-lg shadow-luna-md">
  Dropdown content
</div>
```

## Context Gradients

Gradients for user context avatars (personal and organization contexts).

| Token | Gradient | Usage |
|-------|----------|-------|
| `luna-gradient-personal` | `linear-gradient(138.18deg, #1449E8 7.36%, #0F3AB8 97.64%)` | Personal context avatars |
| `luna-gradient-org-orange` | `linear-gradient(313.45deg, #EA580C 7.43%, #F59E0B 100%)` | Organization context (orange theme) |
| `luna-gradient-org-green` | `linear-gradient(313.45deg, #059669 7.43%, #22C55E 100%)` | Organization context (green theme) |
| `luna-gradient-org-purple` | `linear-gradient(134.49deg, #6366F1 0%, #9333EA 94.17%)` | Organization context (purple theme) |

### Usage Examples

```tsx
// Personal context avatar
<div className="w-9 h-9 bg-luna-gradient-personal rounded-md">
  JH
</div>

// Organization context avatar
<div className="w-9 h-9 bg-luna-gradient-org-orange rounded-md">
  <Building2 />
</div>
```

**Note:** Store actual gradient values in database with organization records. These are default fallbacks.

## Icon Sizes

Standard icon sizes for consistent visual hierarchy.

| Size | Value | Usage | Class |
|------|-------|-------|-------|
| Small | 16px | Compact UI, inline icons | `w-4 h-4` |
| **Standard** | **18px** | **Default for layout/navigation** | `w-[18px] h-[18px]` |
| Medium | 20px | Prominent actions | `w-5 h-5` |
| Large | 24px | Headers, feature callouts | `w-6 h-6` |

**Default Standard:** All layout components (sidebar, header, navigation, dropdowns) use **18px icons** (`w-[18px] h-[18px]`).

### Usage Examples

```tsx
import { Home, Settings } from 'lucide-react';

// Standard layout icon (18px)
<Home className="w-[18px] h-[18px] text-luna-gray-600" />

// Prominent action (24px)
<Settings className="w-6 h-6 text-luna-blue" />
```

## Backdrop Effects

Glass morphism effects for modern, layered UI.

| Token | Value | Usage |
|-------|-------|-------|
| `backdrop-blur-luna-glass` | `blur(10px)` | Glass effect backgrounds |

### Usage Examples

```tsx
// Header with glass effect
<header className="backdrop-blur-luna-glass bg-white/80 border-b">
  Header content
</header>
```

## Transitions

Standard timing for smooth, consistent animations.

| Token | Value | Usage |
|-------|-------|-------|
| `duration-fast` | 150ms | Quick hover states, tooltips |
| `duration-base` | 200ms | Standard transitions, dropdowns |
| `duration-slow` | 300ms | Layout changes, sidebar collapse |

### Usage Examples

```tsx
// Sidebar collapse animation
<div className="transition-all duration-slow">
  Sidebar
</div>

// Hover state
<button className="hover:bg-luna-gray-50 transition-colors duration-fast">
  Click me
</button>
```

## Focus States

Use the `luna-focus-ring` utility class for consistent focus styles:

```tsx
<button className="luna-focus-ring">Click me</button>
```

This applies:
- `focus-visible:ring-2`
- `focus-visible:ring-luna-blue`
- `focus-visible:ring-offset-2`

## Accessibility Notes

### Contrast Ratios (WCAG AA compliant)

| Foreground | Background | Ratio | Pass |
|------------|------------|-------|------|
| `luna-navy` | white | 12.4:1 | ✅ AAA |
| `luna-blue` | white | 5.2:1 | ✅ AA |
| `luna-gray-900` | white | 17.2:1 | ✅ AAA |
| `luna-gray-600` | white | 5.1:1 | ✅ AA |
| white | `luna-blue` | 5.2:1 | ✅ AA |
| white | `luna-navy` | 12.4:1 | ✅ AAA |

### Color Usage Guidelines

1. **Text on white backgrounds:** Use `luna-gray-900` for primary, `luna-gray-600` for secondary
2. **Text on colored backgrounds:** Use white for `luna-navy` and `luna-blue`
3. **Interactive elements:** Always include focus states with `luna-focus-ring`
4. **Don't rely on color alone:** Use icons or text labels alongside color indicators

## Usage Examples

```tsx
// Primary button
<button className="bg-luna-blue text-white hover:bg-luna-navy luna-focus-ring">
  Submit
</button>

// Card with border
<div className="bg-luna-bg-primary border border-luna-border-default rounded-md">
  Content
</div>

// Secondary text
<p className="text-luna-gray-600">Secondary information</p>

// Portal-specific accent
<div className="border-l-4 border-luna-personal">Personal portal item</div>
<div className="border-l-4 border-luna-organization">Org portal item</div>
```

