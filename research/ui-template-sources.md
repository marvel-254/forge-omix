# UI Template Sources & Component Libraries for forge-omix

## Open-Source Component Libraries

### shadcn/ui
- **Installation**: `npx shadcn-ui@latest init` then `npx shadcn-ui@latest add button input card etc.`
- **Features**: Fully customizable, Tailwind-first, accessible components
- **Best for**: General UI components, forms, data display

### DaisyUI
- **Installation**: `npm i daisyui`
- **Configuration**: Add `daisyui` to `plugins` in `tailwind.config.js`
- **Features**: 28+ built-in themes, 100+ components, semantic class names
- **Best for**: Quick styling, consistent design system

### Flowbite React
- **Installation**: `npm i flowbite-react`
- **Configuration**: 
  ```js
  // tailwind.config.js
  plugins: [require('flowbite/plugin')()]
  ```
- **Features**: 60+ components, interactive elements, responsive by default
- **Best for**: Dashboard UIs, modals, complex interactions

### Preline UI
- **Installation**: `npm i preline`
- **Configuration**: No Tailwind config needed - works out of the box
- **Features**: 180+ components, vanilla JS dependencies, minimal
- **Best for**: Marketing pages, simple dashboards, rapid prototyping

## Installation & Configuration Guide

### Flowbite React Integration
```bash
npm i flowbite-react
```

```js
// tailwind.config.js
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx}',
    './node_modules/flowbite-react/lib/**/*.{js,ts,jsx,tsx}',
  ],
  plugins: [require('flowbite/plugin')()],
}
```

### shadcn/ui Integration
```bash
npx shadcn-ui@latest init
npx shadcn-ui@latest add button input card navbar chart table
```

```js
// tailwind.config.js
module.exports = {
  plugins: [require('tailwindcss-animate')()],
}
```

### Preline UI Integration
```bash
npm i preline
```
_No Tailwind config changes needed - works immediately_

## UI Template Libraries

### HyperUI
- **Free templates**: 1000+ UI sections
- **Categories**: Landing pages, dashboards, pricing, features
- **Compatibility**: Tailwind CSS, React, HTML
- **Usage**: Copy-paste sections directly into builder

### Preline UI Templates
- **Free templates**: 50+ complete page templates
- **Categories**: SaaS, portfolio, ecommerce, dashboard
- **Features**: Fully responsive, pre-styled components
- **Usage**: Import components or entire page structures

### Tailblocks
- **Free templates**: 100+ pre-built blocks
- **Categories**: Navbars, sliders, testimonials, forms
- **Compatibility**: Tailwind CSS 3.x
- **Usage**: Mix and match blocks to build pages

## Dashboard-Specific Resources

### Tremor
- **Specialty**: Data visualization charts (bar, line, pie, area, funnel)
- **Components**: 30+ chart types, data grids, status panels
- **Integration**: React + Tailwind, easy prop customization
- **Best for**: Analytics dashboards, KPI panels, monitoring interfaces

### NextUI
- **Components**: 50+ highly customizable UI components
- **Accessibility**: WCAG 2.1 AA compliant
- **Theming**: Light/dark mode, CSS variable themes
- **Best for**: Admin panels, user interfaces, complex forms

### PrimeReact
- **Enterprise components**: 80+ datatable, dialog, tree, chart components
- **Accessibility**: Full ARIA support, keyboard navigation
- **Theming**: Luna Aura, Saga Alta, Material themes
- **Best for**: Complex enterprise dashboards, data-heavy applications

## 2D & 3D Web Capabilities

### Three.js + React Three Fiber
```bash
npm i three @react-three/fiber @react-three/drei
```

```jsx
<Canvas>
  <mesh>
    <boxGeometry />
    <meshStandardMaterial color="skyblue" />
  </mesh>
</Canvas>
```

### @react-three/drei (Helpers & Cameras)
- **OrbitControls**: Mouse-based camera rotation
- **Environment**: HDRI skyboxes, ground planes
- **Loading**: UseProgressiveLoading, useAsyncLoader
- **Helpers**: Grid, axes, boundingBox helpers

### CesiumJS (Geospatial Visualization)
- **Use case**: Interactive maps, sub-meter accuracy mapping
- **Integration**: React components, terrain visualization
- **Licensing**: Free for open source, commercial license for production

## Iconography Libraries

### Lucide React
```bash
npm i lucide-react
```
```jsx
import { Home, Settings, LogOut } from 'lucide-react'
<Home className="w-4 h-4" />
```

### Phosphor Icons
```bash
npm i phosphor-react
```
- **Styles**: Fill, Duotone, Bold, Light, Regex
- **Best for**: Scalable icons that match design system

### FontAwesome
```bash
npm @fortawesome/fontawesome-svg-core
npm @fortawesome/free-solid-scripts
npm @fortawesome/react-fontawesome
```
- **Legacy support**: jQuery compatibility, VR/AR icons
- **Best for**: When existing brand guidelines require FontAwesome

## Full-Stack Boilerplates & Production Templates

### Vercel Templates
- **Auth**: NextAuth.js, Clerk, Auth0 integration
- **DB**: PostgreSQL, MySQL, MongoDB, SQLite
- **Deployment**: Zero-config deployment, preview URLs
- **Examples**: SaaS starter, blog, ecommerce, dashboard

### Netlify Templates
- **Auth**: Netlify Identity, GitHub OAuth, GitLab
- **Functions**: Edge Functions, Background Functions
- **Storage**: Netlify Blobs, Large Media
- **Deploy Previews**: Automatic on every PR

## Debugging & Error Monitoring

### Sentry
```bash
npm @sentry/nextjs
npm @sentry/tracing
```
- **Features**: Real-time error tracking, performance monitoring, session replay
- **Integration**: Automatic error capture, breadcrumb tracking
- **Alerts**: Slack/webhook notifications on critical errors

### LogRocket
- **Session replay**: Watch user interactions
- **Performance**: Network tab, load time optimization
- **Error logs**: JavaScript errors, stack traces, device info

### Eruda (In-Browser Console)
```bash
npm i eruda
```
```jsx
import Eruda from 'eruda'
useEffect(() => {
  Eruda.init()
}, [])
// Show in development only
<Eruda.Position bottom-left />
```

## Security Scanning & Vulnerability Diagnostics

### SonarQube Cloud
- **Free tier**: 15 days trial, community edition available
- **Scanning**: Code quality, bugs, vulnerabilities, security hotspots
- **Integration**: GitHub Actions, GitLab CI, Azure DevOps
- **Metrics**: Technical debt, code coverage, duplication

### GitHub CodeQL
```bash
echo "workflow: 'on: push'" > .github/workflows/codeql-analysis.yml
```
- **Automated**: Pull request analysis, baseline creation
- **Custom queries**: Write custom SQL-like queries for code patterns
- **Integration**: GitHub Advanced Security (extra cost)

### Burp Suite Professional
- **Intercept**: HTTP/HTTPS traffic between client and server
- **Identify**: XSS, CSRF, SQL injection, authentication flaws
- **Scan**: Automated vulnerability scanning of deployed apps

## Developer Workflow & AI Automation

### ntfy (Mobile Notifications)
```bash
npm i ntfy
```
```bash
# Publish notification
echo "Build complete" | ntfy pub my-build-topic

# Subscribe on phone: ntfy subscribe my-build-topic
```

### AI Coding Agents
- **OpenHands**: Autonomous repository automation
- **HERMES**: Dashboard-driven AI agent management
- **Integration**: GitHub Actions, CI/CD pipeline triggers
- **Use cases**: Automated PR creation, bug fixing, feature implementation

## 2D & 3D Web Capabilities Summary

| Capability | Library | Install | Best For |
|------------|---------|---------|----------|
| 3D Graphics | Three.js | `npm i three` | Interactive 3D scenes |
| React 3D | React Three Fiber | `npm i @react-three/fiber` | React + 3D integration |
| Helpers | @react-three/drei | `npm i @react-three/drei` | Common 3D patterns |
| Geospatial | CesiumJS | `npm i cesium` | Maps, terrain, mapping |
| Icons | Lucide React | `npm i lucide-react` | Lightweight icon set |
| Icons | Phosphor Icons | `npm i phosphor-react` | Multiple icon styles |
| Icons | FontAwesome | `@fortawesome/*` | Legacy brand compatibility |

## Comprehensive UI Template Strategy

### Layer 1: Individual Components
- **shadcn/ui**: Maximum customization, fully controlled
- **DaisyUI**: Quick styling, semantic classes
- **Flowbite React**: Interactive components, modals, dropdowns
- **Preline UI**: 180+ ready-to-use components

### Layer 2: Page Sections
- **HyperUI**: 1000+ UI sections copy-paste
- **Preline UI Templates**: 50+ complete pages
- **Tailblocks**: 100+ mix-and-match blocks
- **Vercel/Netlify Templates**: Full-stack foundations

### Layer 3: Data Visualization
- **Tremor**: Chart-focused, easy prop customization
- **NextUI**: General-purpose admin panels
- **PrimeReact**: Enterprise-grade datatables, complex forms

### Layer 4: 3D & Immersion
- **Three.js + R3F**: Custom 3D experiences
- **CesiumJS**: Geospatial, mapping, terrain
- **Lucide/Phosphor/FortAwesome**: Iconography consistency

## Enhancements & Ecosystem Add-ons

### Animations
- **Framer Motion**: `npm i framer-motion`
- **Animate.css**: Classic animation library
- **GSAP**: Advanced timeline animations

### 3D Sequences
- **Aceternity UI**: 3D backgrounds, particles
- **@react-three/drei**: Pre-built helpers
- **Three.js post-processing**: Bloom, glow, depth of field

### Debug & Monitor
- **Sentry**: Error tracking + performance
- **LogRocket**: Session replay + analytics
- **Eruda**: In-browser dev console

### Security
- **SonarQube**: Code quality + vulnerability scanning
- **GitHub CodeQL**: Automated code analysis
- **Burp Suite**: Manual penetration testing

## Full Integration Roadmap

1. **Start with shadcn/ui** for core component needs
2. **Add DaisyUI** for quick styling of secondary components
3. **Integrate Flowbite React** for interactive elements (modals, menus)
4. **Add Tremor** for data visualization needs
5. **Integrate Three.js** for any 3D requirements
6. **Add Sentry** for error tracking
7. **Integrate ntfy** for build notifications
8. **Consider Vercel/Netlify templates** for full-stack foundations

This comprehensive strategy ensures coverage from simple landing pages to complex, data-intensive dashboards with 3D capabilities, all using open-source, freely integratable resources.