# Spectacle Platform - Design Guidelines

## Design Approach

**Hybrid Strategy**: Professional utility design system for core platform + Creative brand-forward design for AR/landing experiences

**Primary Reference**: Stripe (trust, clarity) + Coinbase (Web3 familiarity) + Linear (modern productivity)

**Design Principles**:
- **Trustless Transparency**: Visual clarity that reinforces blockchain security
- **Dual Personality**: Professional for B2B rentals, playful for AR experiences
- **Progressive Disclosure**: Complex features revealed contextually
- **Mobile-First AR**: Seamless camera/AR integration

---

## Core Design Elements

### A. Color Palette

**Platform Core (Rental/Admin)**
- Primary: 245 75% 50% (vibrant purple - Web3 credibility)
- Secondary: 265 70% 55% (deep violet - depth)
- Accent: 175 60% 50% (teal - success states, AR elements)
- Neutral Dark: 240 10% 15% (backgrounds)
- Neutral Light: 240 5% 98% (cards, surfaces)

**AR Experience**
- Game Primary: 320 85% 60% (electric pink - high energy)
- Game Secondary: 280 80% 65% (neon purple)
- Success: 160 70% 50% (vibrant green)
- Warning: 35 95% 60% (orange alerts)

**Dark Mode** (consistent throughout)
- Background: 240 15% 8%
- Surface: 240 12% 12%
- Border: 240 8% 22%
- Text Primary: 0 0% 98%
- Text Secondary: 0 0% 70%

### B. Typography

**Fonts** (via Google Fonts CDN)
- Display/Headings: Inter (weights: 600, 700, 800)
- Body: Inter (weights: 400, 500, 600)
- Monospace: JetBrains Mono (blockchain addresses, contract IDs)

**Type Scale**
- Hero: text-6xl/text-5xl (96px/60px)
- H1: text-4xl (48px)
- H2: text-3xl (36px)
- H3: text-2xl (24px)
- Body Large: text-lg (18px)
- Body: text-base (16px)
- Small: text-sm (14px)
- Micro: text-xs (12px)

### C. Layout System

**Spacing Primitives**: Tailwind units of 2, 4, 8, 12, 16, 20, 24, 32
- Component padding: p-4 to p-8
- Section spacing: py-16 to py-32
- Grid gaps: gap-4, gap-6, gap-8

**Container Strategy**
- Max width: max-w-7xl (1280px) for dashboards
- Content: max-w-6xl (1152px) for marketing
- Reading: max-w-prose (65ch) for documentation
- Full-bleed: AR experiences, hero sections

**Grid Systems**
- Marketplace: grid-cols-1 md:grid-cols-2 lg:grid-cols-3
- Dashboards: 2-column split (sidebar + main)
- AR HUD: Absolute positioned overlays

### D. Component Library

**Navigation**
- Main Nav: Sticky header with blur backdrop (backdrop-blur-lg bg-white/80 dark:bg-gray-900/80)
- Wallet Connection: Prominent connect button with Pera Wallet branding
- Breadcrumbs: For deep admin flows

**Cards & Surfaces**
- Prop Cards: Image-first with hover scale (hover:scale-105), rounded-2xl, shadow-lg
- Stat Cards: Bold numbers, subtle gradients, icons from Heroicons
- Contract Status: Color-coded borders (green=active, orange=pending, red=disputed)

**Forms**
- Input Fields: Rounded-lg, focus:ring-2 ring-purple-500, dark mode support
- Photo Upload: Drag-drop zones with preview thumbnails
- Date Pickers: Calendar component for rental booking
- Wallet Inputs: Monospace font with validation states

**Data Display**
- Tables: Striped rows, sticky headers, sortable columns
- Blockchain Txs: Monospace addresses with copy button, explorer links
- Analytics Charts: Line/bar charts using Chart.js or Recharts
- QR Codes: High-contrast generation with download options

**Modals & Overlays**
- Transaction Confirmation: Large, centered, clear action buttons
- Photo Verification: Side-by-side before/after comparison
- AR Camera: Full-screen with minimal HUD

**Buttons**
- Primary: Gradient from-purple-600 to-pink-600, shadow-lg, text-white
- Secondary: outline variant with backdrop-blur when on images
- Destructive: bg-red-600
- Sizes: px-6 py-3 (default), px-8 py-4 (large), px-4 py-2 (small)

**AR-Specific Components**
- Score HUD: Absolute top-0, gradient overlay from-black/70
- Target Reticle: Circular, pulsing animation
- Countdown Timer: Bold, high-contrast
- Leaderboard: Semi-transparent overlay with blur

### E. Animations

**Minimal Usage - Only Where Valuable**
- Card Hover: Scale 1.05, 200ms ease-out
- Loading: Subtle spinner, no page-blocking loaders
- AR Targets: Gentle floating/pulse for discoverability
- Transaction Success: Single confetti burst (lightweight library)
- NO continuous background animations

---

## Page-Specific Guidelines

### Landing Page (Public)

**Hero Section**
- Full viewport (min-h-screen), gradient background (purple to pink diagonal)
- Large hero image: Event scene with AR overlay effect (floating 3D elements)
- Headline: "Trustless Prop Rentals Meet AR Rewards" - text-6xl, font-bold
- Dual CTAs: "Browse Props" (primary) + "Create Event" (outline with blur)
- Trust indicators: "Secured by Algorand" badge, "1000+ Props Listed"

**Sections** (5-7 sections)
1. Hero (above)
2. How It Works: 3-column cards (Vendors/Organizers/Attendees) with icons, each card rounded-xl with hover effects
3. Features Grid: 2x3 grid showcasing Escrow, AR Games, NFT Rewards, Photo Verification, Analytics, Shopify Integration
4. Live Stats: 4-column metrics (Total TVL, Active Events, Props Available, Rewards Distributed) with animated counters
5. Prop Showcase: Horizontal scroll carousel of featured props with high-quality images
6. Testimonials: 2-column quotes from vendors and organizers with profile photos
7. CTA Section: "Start Your First Event" with signup form (email + wallet connect option)

**Multi-Column Usage**: Features, Stats, Testimonials
**Viewport**: Hero 100vh, sections py-20 to py-32 with natural height

### Marketplace (Browse/Rent)

**Layout**: 2-column (filters sidebar + prop grid)
- Filters: Categories, price range, location, availability
- Grid: 3-column on desktop, 1-column mobile
- Prop Cards: Featured image, title, daily rate, deposit, location, "View Details" button
- Hover state: Shadow elevation, scale

### Organizer Dashboard

**Layout**: Persistent sidebar navigation + main content area
- Sidebar: Event list, create new, settings, wallet info
- Main: Event details, booking status, QR generator, analytics charts
- Photo Verification: Split-screen before/after with AI quality score overlay
- Color-coded status badges throughout

### AR Experience (Mobile Web)

**Full-Screen Immersive**
- Background: Live camera feed
- HUD: Minimal, top gradient overlay for score/time
- Targets: 3D floating spheres with emissive glow
- UI: Large touch-friendly buttons (min 60px height)
- Loading: Centered spinner with "Allow Camera Access" prompt
- Post-Game: Modal with final score, share button with branded overlay generator

---

## Images Section

**Hero Image**: Wide-angle event photograph showing crowd with AR elements composited (giant 3D llama, floating neon spheres, branded booth). Image should convey scale, energy, and technology fusion. Placement: Full-width background with gradient overlay.

**Prop Showcase Images**: High-quality product photography of rental props - inflatables, sculptures, branded installations. Clean backgrounds, consistent lighting. Each card has one primary image with 2-3 additional thumbnails.

**Dashboard Screenshots**: Mockup screens showing analytics, QR codes, photo verification in use. Placement: Feature sections demonstrating platform capabilities.

**Team/Vendor Photos**: Optional authentic photos in testimonial sections to build trust.

**AR Game Screenshots**: Example of in-game view with targets, score overlay. Shows what attendees will experience.