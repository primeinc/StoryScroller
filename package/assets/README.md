# StoryScroller Brand Assets

This directory contains the official StoryScroller logo and brand assets.

## Logo Files

### Primary Logos
- `logo.svg` - Full color horizontal logo (primary use)
- `logo-mono.svg` - Monochrome version (black)
- `logo-white.svg` - White version for dark backgrounds

### Logo Marks
- `mark-only.svg` - Logo mark without text (for compact use)
- `favicon.svg` - Simplified favicon version (32x32)

## Usage Guidelines

### Logo Concept
The StoryScroller logo represents **narrative flow with motion** through:
- **Interleaved ribbons**: Two flowing curves that form an "S" shape, symbolizing story layers and narrative progression
- **Motion trails**: Subtle circular elements indicating directional flow and scroll progression
- **Clean geometry**: Production-grade aesthetic suitable for developer tools

### Color Palette
- **Primary Blue**: #4F46E5 (Indigo-600)
- **Accent Cyan**: #22D3EE (Cyan-400)
- **Text Dark**: #1F2937 (Gray-800)
- **Monochrome**: #000000 (Black) / #FFFFFF (White)

### Typography
- **Font**: Inter (fallback: system-ui, -apple-system, sans-serif)
- **Weight**: 700 (Bold)
- **Letter spacing**: -0.8px (tight kerning)

### Usage Rules

#### ✅ Do
- Use the color version on light backgrounds
- Use the white version on dark backgrounds  
- Use the monochrome version for single-color applications
- Maintain clear space around the logo (minimum 16px)
- Scale proportionally
- Use for headers, documentation, and official materials

#### ❌ Don't
- Modify colors or proportions
- Add effects, shadows, or gradients
- Use pixelated or low-resolution versions
- Place on busy backgrounds without sufficient contrast
- Separate the mark from the text unless using mark-only version

### File Specifications
- **Format**: SVG (vector)
- **Dimensions**: 320x80px (4:1 aspect ratio)
- **Mark only**: 64x80px
- **Favicon**: 32x32px
- **Monochrome compatible**: All versions work in single color

### Implementation Examples

#### HTML
```html
<!-- Primary logo -->
<img src="assets/logo.svg" alt="StoryScroller" width="320" height="80">

<!-- Dark background -->
<img src="assets/logo-white.svg" alt="StoryScroller" width="320" height="80">

<!-- Favicon -->
<link rel="icon" href="assets/favicon.svg" type="image/svg+xml">
```

#### CSS
```css
.logo {
  width: 320px;
  height: 80px;
  object-fit: contain;
}

/* Responsive scaling */
@media (max-width: 768px) {
  .logo {
    width: 240px;
    height: 60px;
  }
}
```

### Brand Context
StoryScroller is a production-ready React component for narrative-driven scroll experiences. The brand targets:
- **Developers**: Clean, technical aesthetic
- **UX Designers**: Motion and interaction focus
- **Professional Use**: Not consumer-facing or playful

The logo avoids clichéd scroll metaphors (scrolls, feathers, timelines) in favor of modern, abstract representation of narrative flow and motion.

## License
These brand assets are part of the StoryScroller project and follow the same MIT license terms.