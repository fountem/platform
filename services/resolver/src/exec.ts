import { spawn } from 'node:child_process'

export interface ExecResult {
  code: number
  stdout: string
  stderr: string
}

export class ExecError extends Error {
  constructor(message: string, readonly result: ExecResult) {
    super(message)
    this.name = 'ExecError'
  }
}

/**
 * Run a command with hard timeout and output caps. No shell interpolation —
 * args are passed as an array so user-supplied URLs can never be interpreted
 * as shell tokens.
 */
export function run(
  cmd: string,
  args: string[],
  opts: { timeoutMs?: number; maxBuffer?: number } = {},
): Promise<ExecResult> {
  const timeoutMs = opts.timeoutMs ?? 60_000
  const maxBuffer = opts.maxBuffer ?? 16 * 1024 * 1024

  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: ['ignore', 'pipe', 'pipe'] })
    let stdout = ''
    let stderr = ''
    let killed = false

    const timer = setTimeout(() => {
      killed = true
      child.kill('SIGKILL')
    }, timeoutMs)

    child.stdout.on('data', (d: Buffer) => {
      stdout += d.toString()
      if (stdout.length > maxBuffer) {
        killed = true
        child.kill('SIGKILL')
      }
    })
    child.stderr.on('data', (d: Buffer) => {
      stderr += d.toString()
      if (stderr.length > maxBuffer) stderr = stderr.slice(0, maxBuffer)
    })

    child.on('error', (err) => {
      clearTimeout(timer)
      reject(new ExecError(`failed to spawn ${cmd}: ${err.message}`, { code: -1, stdout, stderr }))
    })

    child.on('close', (code) => {
      clearTimeout(timer)
      if (killed) {
        reject(new ExecError(`${cmd} timed out or exceeded output cap`, { code: code ?? -1, stdout, stderr }))
        return
      }
      resolve({ code: code ?? -1, stdout, stderr })
    })
  })
}
