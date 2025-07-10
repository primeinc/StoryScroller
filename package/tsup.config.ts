import { defineConfig } from 'tsup'
import { copyFileSync, mkdirSync } from 'fs'
import { join } from 'path'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: true,
  clean: true,
  treeshake: true,
  splitting: false,
  sourcemap: true,
  external: ['react', 'react-dom', 'gsap', 'lenis'],
  onSuccess: async () => {
    // Copy CSS files to dist
    try {
      mkdirSync(join('dist', 'styles'), { recursive: true })
      copyFileSync('src/styles/index.css', 'dist/styles/index.css')
      copyFileSync('src/styles/story-scroller.css', 'dist/styles/story-scroller.css')
      console.log('✓ CSS files copied to dist/styles')
    } catch (error) {
      console.error('Failed to copy CSS files:', error)
    }
  }
})