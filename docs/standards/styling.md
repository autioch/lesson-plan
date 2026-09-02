# Styling & UI

The rules for visual consistency and the responsive surfaces the site targets.

## Surfaces

- **Primary surface:** desktop browsers (1920×1080 and wider), modern Chrome/Firefox/Safari/Edge
- **Secondary surfaces:** tablets (iPad, 768px and up) — tested, optional enhancements
- **Unsupported:** old browsers (no polyfills or IE support)

The primary surface is the binding baseline. Enhancements above it are allowed when the primary
surface still works without them.

## Visual conventions

- **Color:** define a fixed palette in a CSS file or config; use class names or CSS variables, never
  inline styles.
- **Typography:** fixed type scale with named sizes (small, body, large, heading); use semantic
  heading levels (`<h1>` — `<h6>`).
- **Spacing:** fixed scale (4px, 8px, 16px, 24px, etc.); use margin/padding utility classes or
  shared components.
- **Components:** share UI patterns across pages. A button, a card, a table cell — define once, reuse
  everywhere. Extend with optional props (size, variant), never duplicate.

## Building new UI

1. **Follow the design system.** Use existing colors, type styles, and spacing. Extend the system
   before hand-rolling a custom look.
2. **Think mobile-first.** Start with the constraints; add enhancements for larger screens.
3. **Test on the primary surface.** Desktop browser rendering is the truth for this site.
4. **Accessibility:** headings, link text, color contrast, focus states, semantic HTML.
5. **Performance:** keep the CSS small; avoid layout thrashing; preload critical assets.

## Commands

No separate style build. CSS is written in `.astro` files as scoped `<style>` tags or in shared
stylesheets bundled by Astro at build time. Verify responsive behavior in the dev server with
`npm run dev` — resize the browser or use the browser's device emulation.
