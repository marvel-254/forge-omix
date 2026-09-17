# 05 — Component Design System

## 5.1 Component Architecture

Every component in Omix Builder is a declarative definition that captures structure, behavior, and appearance. Components are never inline styles — they reference design tokens, support responsive overrides, and include accessibility metadata.

### Component Instance vs Definition

**Component Definition (Type):**
- Registered once in the system
- Defines prop types, defaults, category
- Similar to a React component or Vue SFC
- Example: `Button` definition with props `{ variant, size, label }`

**Component Instance:**
- Created when user drags onto canvas
- Has unique ID, specific prop values, position, styles
- References its definition type
- Can override any default from definition

```json
{
  "id": "comp_01H...",
  "type": "Button",           // ← references definition
  "name": "Submit Button",    // ← instance name
  "props": {
    "variant": "primary",     // ← overrides default
    "size": "lg"              // ← overrides default
  }
}
```

## 5.2 Component Structure

```json
{
  "id": "comp_uuidv7",
  "type": "Button",
  "name": "Human readable name",
  "props": {
    "variant": "primary",
    "size": "md",
    "label": "Click me",
    "disabled": false
  },
  "children": [],             // Nested component IDs
  "styles": {
    "base": { "margin": { "$ref": "designTokens.spacing.2" } },
    "hover": {},
    "focus": {},
    "active": {}
  },
  "interactions": {
    "onClick": {
      "action": "navigate",
      "target": "/dashboard"
    }
  },
  "responsive": {
    "mobile": { "props": { "size": "lg" } },
    "tablet": {}
  },
  "accessibility": {
    "role": "button",
    "label": "Submit form",
    "keyboardShortcut": "enter"
  }
}
```

## 5.3 Design Token Binding

**Components NEVER use raw values.** All visual properties reference design tokens:

```json
// ❌ WRONG
{ "color": "#3b82f6", "fontSize": "16px" }

// ✅ CORRECT
{ "color": { "$ref": "designTokens.colors.primary.500" },
  "fontSize": { "$ref": "designTokens.typography.base" } }
```

### Token Resolution

At runtime and code generation time, `$ref` pointers resolve to actual values:

```typescript
function resolveToken(ref: string, tokens: DesignTokens): string {
  // "designTokens.colors.primary.500" → "#3b82f6"
  return ref.split('.').slice(1).reduce((obj, key) => obj[key], tokens);
}
```

## 5.9 Media Components

> Full specification: `docs/17-media-handling.md` | Schema: `schemas/media.schema.json`

Media components (`type: "Media"`) handle images, GIFs, and video with native browser rendering and a lightweight image editor.

### Supported Formats
| Type | Formats | Rendering |
|------|---------|-----------|
| image | PNG, JPG, WebP, AVIF, SVG | Native `<img>` with `<picture>` fallback |
| gif | GIF | Native `<img>` (or transcoded video for large files) |
| video | MP4, WebM, OGG | Native `<video>` |

### Image Editing
- **Crop** with aspect ratio presets (Free, 1:1, 4:3, 16:9, 3:2)
- **Rotate** in 90° increments
- **Flip** horizontal/vertical
- **Filters** — brightness, contrast, saturation, blur, grayscale
- **Resize** directly on canvas via drag handles

### Dependencies
| Package | Size | Purpose |
|---------|------|---------|
| `react-image-crop` | ~10KB | Crop/resize/rotate UI |
| `dompurify` | ~15KB | SVG sanitization |

Zero video libraries — native HTML5 `<video>` is sufficient.

### Upload Flow
1. Drag file onto canvas, or click toolbar `[🖼️ Image] [🎞️ GIF] [🎬 Video]`
2. File validated (type, size, dimensions)
3. SVG sanitized via DOMPurify
4. WebP thumbnails generated
5. Stored in project assets with metadata
6. Schema updated with `$ref` to asset

### Forms
Input components for data collection:
- **Input** — Text input (single line)
- **Textarea** — Multi-line text
- **Select** — Dropdown selection
- **Combobox** — Searchable select
- **Checkbox** — Boolean toggle
- **Radio** — Exclusive choice
- **Switch** — On/off toggle
- **Slider** — Range value
- **DatePicker** — Calendar date selection
- **TimePicker** — Time selection
- **FileUpload** — File input with drag-drop
- **Search** — Search input with icon
- **Form** — Form wrapper with validation context

### Navigation
Components for moving through the app:
- **Navbar** — Top navigation bar
- **Sidebar** — Side navigation drawer
- **Tabs** — Tabbed content panels
- **Breadcrumb** — Hierarchical path
- **Pagination** — Page number navigation
- **CommandMenu** — Command palette (Ctrl+K)
- **BottomNavigation** — Mobile bottom tabs
- **MobileNavigation** — Mobile hamburger menu

### Dashboard
Data display components:
- **KPI** — Key Performance Indicator card
- **Statistics** — Metric with trend
- **Chart** — Chart container (Recharts-powered)
- **Table** — Data table (TanStack Table)
- **DataGrid** — Sortable, filterable grid
- **ActivityFeed** — Timeline of events
- **Timeline** — Vertical event timeline
- **Calendar** — Date grid view
- **Analytics** — Analytics dashboard section

### SaaS
Business application patterns:
- **Pricing** — Pricing tier card
- **Billing** — Billing information
- **TeamMembers** — Team member list
- **Subscription** — Subscription status
- **Usage** — Usage metrics display
- **Onboarding** — Onboarding step indicator
- **Workspace** — Workspace selector
- **Settings** — Settings section wrapper

### E-commerce
Commerce patterns:
- **ProductCard** — Product preview card
- **ProductGrid** — Responsive product grid
- **ProductDetails** — Full product view
- **Cart** — Shopping cart summary
- **Checkout** — Checkout form flow
- **Order** — Order summary/details
- **Inventory** — Inventory status
- **Reviews** — Review list with ratings
- **Wishlist** — Wishlist toggle/button

### Website
Marketing page patterns:
- **Hero** — Landing page hero section
- **Features** — Feature grid/cards
- **Testimonials** — Customer quotes
- **FAQ** — Accordion FAQ section
- **CTA** — Call-to-action section
- **Footer** — Page footer
- **Blog** — Blog post list/card
- **Contact** — Contact form section

### Mobile
Mobile-specific patterns:
- **AppBar** — Mobile top app bar
- **BottomSheet** — Draggable bottom sheet
- **MobileCard** — Mobile-optimized card
- **MobileList** — Mobile list item
- **MobileForm** — Stacked mobile form
- **MobileDialog** — Full-screen mobile dialog

## 5.5 Component Registration

Components register themselves with the system:

```typescript
// In component definition file
export const ButtonComponent: ComponentDefinition = {
  type: 'Button',
  category: 'basic',
  name: 'Button',
  description: 'A clickable button element',
  icon: 'MousePointer',
  
  props: {
    variant: {
      type: 'enum',
      values: ['primary', 'secondary', 'outline', 'ghost', 'link'],
      default: 'primary',
      control: 'select'
    },
    size: {
      type: 'enum',
      values: ['sm', 'md', 'lg'],
      default: 'md',
      control: 'radio'
    },
    label: {
      type: 'string',
      default: 'Button',
      control: 'text'
    },
    disabled: {
      type: 'boolean',
      default: false,
      control: 'switch'
    }
  },
  
  // Generated code template
  template: (props) => `
    <button
      className={cn(
        buttonVariants({ variant: "${props.variant}", size: "${props.size}" }),
        className
      )}
      ${props.disabled ? 'disabled' : ''}
    >
      ${props.label}
    </button>
  `
};
```

## 5.6 Component Composition

### Slots
Components can define slots for child content:

```json
{
  "type": "Card",
  "slots": {
    "header": { "maxChildren": 2 },
    "body": { "maxChildren": null },
    "footer": { "maxChildren": 3 }
  }
}
```

### Compound Components
Some components are compound (composed of sub-components):

```json
{
  "type": "Tabs",
  "compound": true,
  "children": [
    { "type": "TabsList", "children": [
      { "type": "TabsTrigger", "props": { "value": "tab1", "label": "Tab 1" } },
      { "type": "TabsTrigger", "props": { "value": "tab2", "label": "Tab 2" } }
    ]},
    { "type": "TabsContent", "props": { "value": "tab1" } },
    { "type": "TabsContent", "props": { "value": "tab2" } }
  ]
}
```

## 5.7 Component Interactions

Interactions define how components respond to events:

```json
{
  "interactions": {
    "onClick": {
      "action": "navigate",
      "target": "/dashboard",
      "params": {}
    },
    "onSubmit": {
      "action": "submitForm",
      "target": "form_01H...",
      "params": { "method": "POST", "endpoint": "/api/users" }
    },
    "onHover": {
      "action": "setState",
      "target": "ui.hoveredCard",
      "params": { "value": "comp_01H..." }
    }
  }
}
```

### Action Types

| Action | Description | Params |
|--------|-------------|--------|
| `navigate` | Navigate to path/URL | `target` (path) |
| `submitForm` | Submit a form | `target` (form ID), `endpoint`, `method` |
| `setState` | Update application state | `target` (state key), `value` |
| `toggleState` | Boolean toggle | `target` (state key) |
| `callAPI` | Make API request | `endpoint`, `method`, `body` |
| `showModal` | Open modal/dialog | `target` (modal ID) |
| `closeModal` | Close modal | `target` (modal ID) |
| `copyToClipboard` | Copy text to clipboard | `text` |
| `downloadFile` | Trigger file download | `url`, `filename` |
| `scrollTo` | Scroll to element | `target` (element ID) |

## 5.8 Accessibility Requirements

Every component definition includes accessibility metadata:

```json
{
  "accessibility": {
    "role": "button",
    "label": "Submit payment",
    "description": "Processes the payment form",
    "keyboardShortcut": "ctrl+enter",
    "focusable": true,
    "focusStyle": { "outline": "2px solid", "outlineColor": { "$ref": "designTokens.colors.ring" } }
  }
}
```

### ARIA Rules
1. All interactive components have an accessible name
2. Form inputs have associated labels
3. Dynamic content uses live regions
4. Focus management for modals and dialogs
5. Keyboard navigation for custom components

### Accessibility Audit
The builder analyzes generated code for:
- Missing alt text on images
- Insufficient color contrast (< 4.5:1 for text)
- Missing form labels
- Improper heading hierarchy
- Keyboard traps
- Missing focus indicators
