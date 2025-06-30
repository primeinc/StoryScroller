# GitHub Pages Deployment Guide

This guide explains how to deploy the StoryScroller demo to GitHub Pages.

## Automatic Deployment

The demo is automatically deployed to GitHub Pages when changes are pushed to the `main` branch.

### GitHub Actions Workflow

The deployment is handled by `.github/workflows/deploy-demo.yml` which:

1. Builds the package
2. Builds the demo with the correct base path (`/StoryScroller/`)
3. Uploads the build artifacts
4. Deploys to GitHub Pages

## Manual Deployment

To manually build the demo for GitHub Pages:

```bash
cd demo
pnpm run deploy:github
```

This script:
- Sets the correct base path for GitHub Pages
- Updates URLs in sitemap.xml
- Creates necessary files (.nojekyll)
- Ensures proper base tag in index.html

## Initial Setup

To enable GitHub Pages for your repository:

1. Go to your repository settings: https://github.com/primeinc/StoryScroller/settings
2. Navigate to **Pages** in the left sidebar
3. Under **Source**, select **Deploy from a branch**
4. Select **gh-pages** branch (created by GitHub Actions)
5. Click **Save**

## Accessing the Demo

Once deployed, the demo will be available at:
https://primeinc.github.io/StoryScroller/

## Configuration Details

### Base Path

The demo is configured to work from a subdirectory (`/StoryScroller/`) on GitHub Pages:

- **Vite Config**: Uses `base` option with `process.env.PUBLIC_URL`
- **Build Command**: `vite build --base=/StoryScroller/`
- **HTML Base Tag**: Automatically added to ensure correct asset loading

### File Structure

The deployment creates:
```
dist/
├── .nojekyll          # Prevents Jekyll processing
├── index.html         # Main entry with base tag
├── sitemap.xml        # Updated with GitHub Pages URL
└── assets/            # JS, CSS, and other assets
```

## Troubleshooting

### Assets Not Loading

If assets don't load correctly:
1. Check that the base tag is present in index.html
2. Verify URLs start with `/StoryScroller/`
3. Ensure `.nojekyll` file exists

### 404 Errors

If you get 404 errors:
1. Wait a few minutes for deployment to complete
2. Check GitHub Actions for build errors
3. Verify GitHub Pages is enabled in settings

### Build Failures

If the build fails:
1. Check GitHub Actions logs
2. Ensure all dependencies are installed
3. Verify package builds successfully locally

## Local Testing

To test the GitHub Pages build locally:

```bash
# Build with GitHub Pages configuration
cd demo
pnpm run deploy:github

# Serve the built files
npx serve dist -p 3000
```

Then open http://localhost:3000/StoryScroller/ in your browser.

## Updating URLs

All GitHub repository URLs have been updated to use the correct capitalization:
- ✅ `https://github.com/primeinc/StoryScroller`
- ❌ ~~`https://github.com/primeinc/storyscroller`~~
- ❌ ~~`https://github.com/primeinc/story-scroller`~~