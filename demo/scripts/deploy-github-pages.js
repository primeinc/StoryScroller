#!/usr/bin/env node

/**
 * Deploy script for GitHub Pages
 * Handles base path configuration for serving from subdirectory
 */

import { execSync } from 'child_process'
import { readFileSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT_DIR = join(__dirname, '..')

// GitHub Pages configuration
const GITHUB_PAGES_BASE = '/StoryScroller/'

console.log('🚀 Preparing demo for GitHub Pages deployment...')

try {
  // Set environment variable for base path
  process.env.PUBLIC_URL = GITHUB_PAGES_BASE
  
  // Build with correct base path
  console.log(`📦 Building with base path: ${GITHUB_PAGES_BASE}`)
  execSync(`vite build --base=${GITHUB_PAGES_BASE}`, {
    cwd: ROOT_DIR,
    stdio: 'inherit',
    env: { ...process.env, PUBLIC_URL: GITHUB_PAGES_BASE }
  })
  
  // Update sitemap.xml with correct base URL
  const sitemapPath = join(ROOT_DIR, 'dist', 'sitemap.xml')
  try {
    let sitemap = readFileSync(sitemapPath, 'utf8')
    sitemap = sitemap.replace(
      /https:\/\/storyscroller-demo\.vercel\.app/g,
      'https://primeinc.github.io/StoryScroller'
    )
    writeFileSync(sitemapPath, sitemap)
    console.log('✅ Updated sitemap.xml with GitHub Pages URL')
  } catch (err) {
    console.warn('⚠️  Could not update sitemap.xml:', err.message)
  }
  
  // Create .nojekyll file to prevent Jekyll processing
  writeFileSync(join(ROOT_DIR, 'dist', '.nojekyll'), '')
  console.log('✅ Created .nojekyll file')
  
  // Copy 404.html for SPA routing on GitHub Pages
  try {
    const src404 = join(ROOT_DIR, 'public', '404.html')
    const dest404 = join(ROOT_DIR, 'dist', '404.html')
    const content404 = readFileSync(src404, 'utf8')
    writeFileSync(dest404, content404)
    console.log('✅ Copied 404.html for SPA routing')
  } catch (err) {
    console.warn('⚠️  Could not copy 404.html:', err.message)
  }
  
  // Update index.html with correct base tag
  const indexPath = join(ROOT_DIR, 'dist', 'index.html')
  let indexHtml = readFileSync(indexPath, 'utf8')
  
  // Ensure base tag is present
  if (!indexHtml.includes('<base')) {
    indexHtml = indexHtml.replace(
      '<head>',
      `<head>\n    <base href="${GITHUB_PAGES_BASE}">`
    )
    writeFileSync(indexPath, indexHtml)
    console.log('✅ Added base tag to index.html')
  }
  
  console.log('\n✨ Build complete! Demo is ready for GitHub Pages deployment.')
  console.log('\n📝 Next steps:')
  console.log('1. Push changes to main branch')
  console.log('2. GitHub Actions will automatically deploy to GitHub Pages')
  console.log('3. Enable GitHub Pages in repository settings:')
  console.log('   - Go to Settings > Pages')
  console.log('   - Source: Deploy from a branch')
  console.log('   - Branch: gh-pages (created by Actions)')
  console.log(`4. Demo will be available at: https://primeinc.github.io/StoryScroller/`)
  
} catch (error) {
  console.error('❌ Build failed:', error.message)
  process.exit(1)
}