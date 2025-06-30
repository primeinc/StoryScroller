#!/usr/bin/env node

/**
 * Script to add MIT license headers to TypeScript source files
 * Usage: node scripts/add-license-headers.js
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const packageRoot = path.resolve(__dirname, '..')

const LICENSE_HEADER = `/**
 * @license
 * Copyright (c) 2025 Prime Inc
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

`

/**
 * Check if file already has license header
 */
function hasLicenseHeader(content) {
  return content.includes('@license') || content.includes('Copyright (c) 2025 Prime Inc')
}

/**
 * Add license header to file content
 */
function addLicenseHeader(content) {
  // If file starts with shebang, preserve it
  if (content.startsWith('#!')) {
    const lines = content.split('\n')
    const shebang = lines[0]
    const rest = lines.slice(1).join('\n')
    return shebang + '\n\n' + LICENSE_HEADER + rest
  }
  
  return LICENSE_HEADER + content
}

/**
 * Process a single file
 */
function processFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8')
    
    // Skip if already has license header
    if (hasLicenseHeader(content)) {
      console.log(`✓ ${filePath} (already has license header)`)
      return
    }
    
    // Add license header
    const newContent = addLicenseHeader(content)
    fs.writeFileSync(filePath, newContent, 'utf8')
    console.log(`✓ ${filePath} (license header added)`)
  } catch (error) {
    console.error(`✗ ${filePath} (error: ${error.message})`)
  }
}

/**
 * Recursively find TypeScript files
 */
function findTypeScriptFiles(dir, files = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    
    if (entry.isDirectory()) {
      // Skip node_modules, dist, .git, etc.
      if (!['node_modules', 'dist', '.git', '.github', 'coverage', 'test-results'].includes(entry.name)) {
        findTypeScriptFiles(fullPath, files)
      }
    } else if (entry.isFile()) {
      // Include .ts, .tsx files, but exclude .d.ts files
      if ((entry.name.endsWith('.ts') || entry.name.endsWith('.tsx')) && !entry.name.endsWith('.d.ts')) {
        files.push(fullPath)
      }
    }
  }
  
  return files
}

/**
 * Main execution
 */
function main() {
  console.log('🔍 Finding TypeScript files...')
  
  const srcDir = path.join(packageRoot, 'src')
  const files = findTypeScriptFiles(srcDir)
  
  console.log(`📁 Found ${files.length} TypeScript files`)
  console.log('📝 Adding license headers...\n')
  
  for (const file of files) {
    const relativePath = path.relative(packageRoot, file)
    processFile(file)
  }
  
  console.log(`\n✅ License header processing complete!`)
  console.log(`📊 Processed ${files.length} files`)
}

// Run the script
main()