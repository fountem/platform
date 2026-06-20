/**
 * Live-URL audio puller.
 *
 * Pipes a live stream through yt-dlp (which supports ~1800 sites incl. YouTube
 * Live / X / Twitch) into ffmpeg, which transcodes to 16 kHz mono linear16 PCM
 * — the format Deepgram streaming expects. Returns a readable PCM stream plus a
 * kill() to tear both processes down.
 *
 * No shell interpolation: args are arrays, so a hostile URL can never be
 * interpreted as a shell token.
 */
import { spawn } from 'node:child_process'
import type { Readable } from 'node:stream'

export interface AudioPull {
  pcm: Readable
  kill: () => void
}

export const PCM_SAMPLE_RATE = 16000

export function pullLiveAudio(url: string): AudioPull {
  // yt-dlp downloads/relays the best audio to stdout. Default stdio is 'pipe'
  // for all three fds, which gives non-null typed streams; we never write to
  // its stdin (yt-dlp reads from the network).
  const ytdlp = spawn(
    'yt-dlp',
    ['--quiet', '--no-warnings', '--no-playlist', '-f', 'bestaudio/best', '-o', '-', url],
  )

  // ffmpeg transcodes the piped audio to 16k mono s16le on stdout.
  const ffmpeg = spawn(
    'ffmpeg',
    [
      '-hide_banner', '-loglevel', 'error',
      '-i', 'pipe:0',
      '-ac', '1',
      '-ar', String(PCM_SAMPLE_RATE),
      '-f', 's16le',
      'pipe:1',
    ],
  )

  ytdlp.stdout.pipe(ffmpeg.stdin)
  ytdlp.on('error', (e) => console.error('[gateway] yt-dlp error', e.message))
  ffmpeg.on('error', (e) => console.error('[gateway] ffmpeg error', e.message))
  ytdlp.stderr.on('data', (d: Buffer) => {
    const s = d.toString().trim()
    if (s) console.error('[gateway] yt-dlp:', s.slice(0, 200))
  })

  let killed = false
  const kill = () => {
    if (killed) return
    killed = true
    try { ytdlp.kill('SIGKILL') } catch { /* noop */ }
    try { ffmpeg.kill('SIGKILL') } catch { /* noop */ }
  }

  return { pcm: ffmpeg.stdout, kill }
}
