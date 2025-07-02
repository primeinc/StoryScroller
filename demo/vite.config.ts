import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const isProduction = mode === 'production'
  
  return {
    // Support base path for GitHub Pages deployment
    base: process.env.PUBLIC_URL || '/',
    
    plugins: [
      react({
        // Enable React Fast Refresh in development (Note: fastRefresh is deprecated, now enabled by default)
      }),
    ],
    
    resolve: {
      alias: {
        '@primeinc/storyscroller': path.resolve(__dirname, '../package/src/index.ts'),
      },
    },
    
    server: {
      port: 5184,
      host: true, // Allow external connections
    },
    
    build: {
      // Production optimizations
      target: 'es2015',
      minify: isProduction ? 'esbuild' : false,
      
      // Chunk splitting for better caching
      rollupOptions: {
        output: {
          manualChunks: {
            // Vendor chunks
            'react-vendor': ['react', 'react-dom'],
            'animation-vendor': ['gsap', '@gsap/react', 'lenis'],
            'story-scroller': ['@primeinc/storyscroller'],
          },
          
          // Asset file naming
          assetFileNames: (assetInfo) => {
            const info = assetInfo.name?.split('.') || []
            let extType = info[info.length - 1] || 'assets'
            
            if (extType && /png|jpe?g|svg|gif|tiff|bmp|ico/i.test(extType)) {
              extType = 'images'
            } else if (extType && /woff2?|eot|ttf|otf/i.test(extType)) {
              extType = 'fonts'
            } else if (extType && /css/i.test(extType)) {
              extType = 'styles'
            }
            
            return `assets/${extType}/[name]-[hash][extname]`
          },
          
          chunkFileNames: 'assets/js/[name]-[hash].js',
          entryFileNames: 'assets/js/[name]-[hash].js',
        },
      },
      
      // Bundle size limits
      chunkSizeWarningLimit: 1000,
      
      // Source maps for debugging in production
      sourcemap: isProduction ? 'hidden' : true,
    },
    
    // CSS optimization
    css: {
      devSourcemap: !isProduction,
    },
    
    // Environment variables
    define: {
      __APP_VERSION__: JSON.stringify(process.env.npm_package_version || '1.0.0'),
      __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
      __DEV__: JSON.stringify(!isProduction),
    },
    
    // Performance optimizations
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'gsap',
        '@gsap/react',
        'lenis',
      ],
      exclude: [
        '@primeinc/storyscroller', // Always use local version
      ],
    },
    
    test: {
      environment: 'jsdom',
      globals: true,
      setupFiles: ['./tests/setup.ts'],
      include: ['src/**/*.test.{js,jsx,ts,tsx}', 'tests/**/*.test.{js,jsx,ts,tsx}'],
      exclude: ['tests/**/*.spec.{js,jsx,ts,tsx}', '**/node_modules/**', '**/dist/**'],
    },
  }
})