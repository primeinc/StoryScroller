#!/usr/bin/env node
import { createDevServerCLI } from '@primeinc/dev-tools'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(__dirname, '..')

// Create CLI with app-specific configuration
const cli = createDevServerCLI({
  projectRoot,
  port: 5184,
  pidFile: path.join(projectRoot, '.dev-server.pid'),
  verbose: true, // Add logging
})

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\nReceived SIGINT, cleaning up...')
  await cli.run(['stop'])
  process.exit(0)
})

process.on('SIGTERM', async () => {
  console.log('\nReceived SIGTERM, cleaning up...')
  await cli.run(['stop'])
  process.exit(0)
})

// Run CLI
if (import.meta.url === `file://${process.argv[1]}`) {
  cli.run().then(
    () => process.exit(0),
    () => process.exit(1)
  )
}