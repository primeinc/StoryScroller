#!/usr/bin/env node
import { DevServerManager } from './dev-server.js'

export function createDevServerCLI(options = {}) {
  const manager = new DevServerManager(options)

  return {
    async run(args = process.argv.slice(2)) {
      const command = args[0]

      try {
        switch (command) {
          case 'dev':
          case '':
          case undefined: {
            // Smart mode: reuse healthy server or start new
            const pidUsingPort = await manager.checkPort(manager.port)

            if (pidUsingPort) {
              const healthy = await manager.healthCheck(manager.port)

              if (healthy) {
                console.log(
                  `Reusing existing healthy dev server on port ${manager.port} (PID: ${pidUsingPort})`
                )
                return { port: manager.port, pid: pidUsingPort, reused: true }
              } else {
                throw new Error(
                  `Port ${manager.port} is in use by another process (PID: ${pidUsingPort}) or unhealthy.\n\n` +
                    `Options:\n` +
                    `- Stop the process using the port: kill ${pidUsingPort}\n` +
                    `- Use 'pnpm dev:start' to force start (will kill existing process)\n` +
                    `- Use 'pnpm dev:stop' to stop any managed dev server`
                )
              }
            }

            return await manager.start()
          }

          case '--start':
          case 'start':
            return await manager.start({ force: true })

          case '--stop':
          case 'stop':
            return await manager.stop()

          case '--restart':
          case 'restart':
            return await manager.restart()

          case '--status':
          case 'status': {
            const status = await manager.status()
            console.log(status.message)
            return status
          }

          default:
            console.log(`
Dev Server Manager

Usage:
  <script> <command>

Commands:
  dev           Start or reuse server (default)
  start         Force start new server
  stop          Stop dev server
  restart       Stop then start dev server
  status        Check if dev server is running

Examples:
  pnpm dev
  pnpm dev:start
  pnpm dev:stop
  pnpm dev:status
            `)
            throw new Error('Unknown command')
        }
      } catch (error) {
        console.error(
          'Error:',
          error instanceof Error ? error.message : String(error)
        )
        throw error
      }
    },
  }
}
