import { spawn, exec } from 'child_process'
import { promisify } from 'util'
import fs from 'fs/promises'
import path from 'path'
import http from 'http'
import pc from 'picocolors'

const execAsync = promisify(exec)

export class DevServerManager {
  /**
   * @param {Object} options
   * @param {number} [options.port=5173]
   * @param {string} [options.projectRoot]
   * @param {string} [options.pidFile]
   * @param {string[]} [options.command]
   * @param {string} [options.healthCheckUrl]
   */
  constructor(options = {}) {
    this.port = options.port || 5173
    this.projectRoot = options.projectRoot || process.cwd()
    this.pidFile =
      options.pidFile || path.join(this.projectRoot, '.dev-server.pid')
    this.command = options.command || [
      'npx',
      'vite',
      '--port',
      this.port.toString(),
    ]
    this.healthCheckUrl =
      options.healthCheckUrl || `http://localhost:${this.port}`
  }

  /**
   * @param {number} port
   * @returns {Promise<number|null>}
   */
  async checkPort(port) {
    try {
      const { stdout } = await execAsync(`lsof -ti:${port}`)
      return stdout.trim() ? parseInt(stdout.trim()) : null
    } catch {
      return null // Port is free
    }
  }

  /**
   * @param {number} port
   * @returns {Promise<boolean>}
   */
  async healthCheck(port) {
    const url = this.healthCheckUrl.replace(`:${this.port}`, `:${port}`)
    return new Promise((resolve) => {
      const req = http.get(url, { timeout: 2000 }, (res) => {
        resolve(res.statusCode === 200)
      })

      req.on('error', () => resolve(false))
      req.on('timeout', () => {
        req.destroy()
        resolve(false)
      })
    })
  }

  async readPidFile() {
    try {
      const content = await fs.readFile(this.pidFile, 'utf8')
      return JSON.parse(content)
    } catch {
      return null
    }
  }

  /**
   * @param {Object} data
   * @returns {Promise<void>}
   */
  async writePidFile(data) {
    await fs.writeFile(this.pidFile, JSON.stringify(data, null, 2))
  }

  async removePidFile() {
    try {
      await fs.unlink(this.pidFile)
    } catch {
      // File doesn't exist, that's fine
    }
  }

  /**
   * @param {number} pid
   * @returns {Promise<boolean>}
   */
  async isProcessRunning(pid) {
    try {
      process.kill(pid, 0)
      return true
    } catch {
      return false
    }
  }

  /**
   * @param {number} pid
   * @param {string} [signal='SIGTERM']
   * @returns {Promise<boolean>}
   */
  async killProcess(pid, signal = 'SIGTERM') {
    try {
      process.kill(pid, signal)

      // Wait for process to die
      for (let i = 0; i < 30; i++) {
        if (!(await this.isProcessRunning(pid))) {
          return true
        }
        await new Promise((resolve) => setTimeout(resolve, 100))
      }

      // Force kill if still running
      if (await this.isProcessRunning(pid)) {
        process.kill(pid, 'SIGKILL')
        await new Promise((resolve) => setTimeout(resolve, 500))
      }

      return !(await this.isProcessRunning(pid))
    } catch {
      return false
    }
  }

  async status() {
    const pidData = await this.readPidFile()

    if (!pidData) {
      return { running: false, message: 'No PID file found' }
    }

    const { pid, port, startTime } = pidData
    const processRunning = await this.isProcessRunning(pid)

    if (!processRunning) {
      await this.removePidFile()
      return {
        running: false,
        message: 'Process not running (cleaned up stale PID file)',
      }
    }

    const portInUse = await this.checkPort(port)
    if (portInUse !== pid) {
      return {
        running: false,
        message: `Port ${port} not owned by tracked process`,
      }
    }

    const healthy = await this.healthCheck(port)
    if (!healthy) {
      return {
        running: false,
        message: `Server on port ${port} failed health check`,
      }
    }

    const uptime = Math.round((Date.now() - startTime) / 1000)
    return {
      running: true,
      pid,
      port,
      uptime: `${uptime}s`,
      message: `Dev server running on port ${port} (PID: ${pid}, uptime: ${uptime}s)`,
    }
  }

  async stop() {
    const pidData = await this.readPidFile()

    if (!pidData) {
      console.log(pc.yellow('No server to stop (no PID file)'))
      return true
    }

    const { pid, port } = pidData
    console.log(pc.blue(`Stopping dev server (PID: ${pid}, port: ${port})...`))

    const killed = await this.killProcess(pid)
    await this.removePidFile()

    if (killed) {
      console.log(pc.green('Dev server stopped successfully'))
      return true
    } else {
      console.log(pc.red('Failed to stop dev server process'))
      return false
    }
  }

  /**
   * @param {Object} [options={}]
   * @param {boolean} [options.force=false]
   * @returns {Promise<{port: number, pid: number, reused: boolean}>}
   */
  async start(options = {}) {
    const forceKill = options.force || false

    // Check if managed server is already running
    const status = await this.status()
    if (status.running) {
      console.log(pc.yellow(`Dev server already running: ${status.message}`))
      return { port: status.port, pid: status.pid, reused: true }
    }

    // Check if port is available
    const pidUsingPort = await this.checkPort(this.port)
    if (pidUsingPort) {
      const healthy = await this.healthCheck(this.port)

      if (!healthy || forceKill) {
        console.log(
          pc.yellow(
            `Killing process on port ${this.port} (PID: ${pidUsingPort})...`
          )
        )
        await this.killProcess(pidUsingPort)
        await new Promise((resolve) => setTimeout(resolve, 1000))
      } else {
        throw new Error(
          `Port ${this.port} is already in use by a healthy server (PID: ${pidUsingPort})`
        )
      }
    }

    console.log(pc.blue(`Starting dev server on port ${this.port}...`))

    // Start the server
    const [cmd, ...args] = this.command
    const child = spawn(cmd, args, {
      cwd: this.projectRoot,
      stdio: ['ignore', 'ignore', 'ignore'],
      detached: true,
      env: { ...process.env },
    })

    child.unref()

    child.on('error', (err) => {
      console.error(pc.red('Failed to start dev server:'), err.message)
      throw err
    })

    // Wait for server to start
    await new Promise((resolve) => setTimeout(resolve, 3000))

    // Find the actual process
    const actualPid = await this.checkPort(this.port)
    if (!actualPid) {
      throw new Error('Dev server failed to bind to port')
    }

    // Verify it's healthy
    const healthy = await this.healthCheck(this.port)
    if (!healthy) {
      throw new Error('Dev server started but failed health check')
    }

    // Save PID file
    const pidData = {
      pid: actualPid,
      port: this.port,
      startTime: Date.now(),
      command: this.command.join(' '),
    }

    await this.writePidFile(pidData)
    console.log(
      pc.green(`Dev server started on port ${this.port} (PID: ${actualPid})`)
    )
    console.log(pc.blue(`Server ready at http://localhost:${this.port}`))

    return { port: this.port, pid: actualPid, reused: false }
  }

  async restart() {
    console.log(pc.blue('Restarting dev server...'))
    await this.stop()
    return await this.start({ force: true })
  }
}
