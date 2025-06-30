# Social Preview Images

This document describes the social preview images needed for the StoryScroller GitHub repository and demo application.

## Required Images

### 1. GitHub Repository Social Preview
**Path**: `.github/assets/og-image.png`
**Dimensions**: 1280x640px
**Format**: PNG

**Content**:
- Background: Gradient from #667eea to #764ba2
- Title: "StoryScroller" (large, white text)
- Subtitle: "Production-ready narrative scrolling for React"
- Visual elements: Abstract scrolling sections or animation frames
- Logo/branding: Prime Inc logo in corner
- Tech stack icons: React, GSAP, Lenis logos

### 2. Demo Application Open Graph Image
**Path**: `demo/public/og-image.png`
**Dimensions**: 1200x630px
**Format**: PNG

**Content**:
- Background: Similar gradient to repository image
- Title: "StoryScroller Demo"
- Subtitle: "Interactive narrative scrolling experience"
- Visual: Screenshot or mockup of the demo sections
- Call to action: "Try the demo"

### 3. Demo Application Twitter Card
**Path**: `demo/public/twitter-card.png`
**Dimensions**: 1200x600px
**Format**: PNG

**Content**:
- Similar to Open Graph but optimized for Twitter
- More compact text layout
- Twitter-friendly color scheme

### 4. Favicon Package
**Path**: `demo/public/`
**Files**:
- `favicon.ico` (32x32px)
- `favicon.svg` (vector)
- `apple-touch-icon.png` (180x180px)
- `icon-192.png` (192x192px)
- `icon-512.png` (512x512px)

**Content**:
- Simplified StoryScroller logo
- Brand colors: #667eea primary
- Clean, scalable design

## Design Guidelines

### Color Palette
- Primary: #667eea (Blue gradient start)
- Secondary: #764ba2 (Purple gradient end)
- Accent: #ffffff (White text)
- Background: Linear gradient or solid primary

### Typography
- Primary font: Inter, SF Pro Display, or system-ui
- Weight: 700-800 for titles, 400-500 for subtitles
- High contrast for readability

### Visual Elements
- Smooth scrolling animation representation
- Section-based layouts
- Modern, clean design aesthetic
- Professional tech branding

### Brand Identity
- Professional and trustworthy
- Performance-focused
- Developer-friendly
- Modern React ecosystem

## Implementation Notes

### GitHub Repository
1. Upload `og-image.png` to `.github/assets/`
2. Update repository social preview in GitHub settings
3. Test with social media preview tools

### Demo Application
1. Place images in `demo/public/` directory
2. Reference in HTML meta tags (already configured)
3. Verify with Open Graph debugger
4. Test Twitter card validator

### Tools for Creation
- **Figma**: For design and layout
- **Canva**: For quick social media graphics
- **Adobe Creative Suite**: For professional design
- **Sketch**: For UI/UX focused designs

### Image Optimization
- Use `imagemin` or similar tools
- Optimize for web delivery
- Maintain quality for high-DPI displays
- Consider WebP format with PNG fallback

## Template Code

### HTML Meta Tags (already implemented)
```html
<!-- Open Graph -->
<meta property="og:image" content="/og-image.png" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />

<!-- Twitter -->
<meta name="twitter:image" content="/twitter-card.png" />
<meta name="twitter:card" content="summary_large_image" />
```

### GitHub Repository Settings
1. Go to repository Settings
2. Scroll to "Social preview"
3. Upload the 1280x640px image
4. Save changes

## Verification Checklist

- [ ] GitHub repository shows preview image
- [ ] Open Graph debugger validates demo images
- [ ] Twitter card validator shows correct preview
- [ ] All favicons load correctly
- [ ] Images are optimized for performance
- [ ] High contrast mode compatibility
- [ ] Mobile/responsive preview testing

## Future Enhancements

### Animated Previews
- Consider GIF or video previews for social media
- Show actual scrolling animation
- Keep file size under platform limits

### A/B Testing
- Test different image styles
- Monitor click-through rates
- Optimize based on engagement metrics

### Seasonal Updates
- Update images for major releases
- Refresh design annually
- Maintain brand consistency

---

*Note: Actual image files need to be created using design tools. This document provides specifications and requirements for the design team or developer creating the images.*