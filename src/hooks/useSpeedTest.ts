import { useState, useRef, useCallback } from 'react'
import type { SpeedTestResult, TestPhase } from '../lib/types'

// Cloudflare __down endpoint for download speed test chunks
// Using publicly available CDN resources for reliable cross-origin downloads
const DOWNLOAD_URLS = [
  'https://speed.cloudflare.com/__down?bytes=10000000',
  'https://speed.cloudflare.com/__down?bytes=10000000',
  'https://speed.cloudflare.com/__down?bytes=10000000',
]

const UPLOAD_URL = 'https://speed.cloudflare.com/__up'

interface UseSpeedTestReturn {
  phase: TestPhase
  result: SpeedTestResult
  liveDownload: number
  liveUpload: number
  livePing: number
  progress: number
  startTest: () => Promise<void>
  reset: () => void
}

const INITIAL_RESULT: SpeedTestResult = {
  downloadMbps: 0,
  uploadMbps: 0,
  pingMs: 0,
  jitterMs: 0,
}

export function useSpeedTest(): UseSpeedTestReturn {
  const [phase, setPhase] = useState<TestPhase>('idle')
  const [result, setResult] = useState<SpeedTestResult>(INITIAL_RESULT)
  const [liveDownload, setLiveDownload] = useState(0)
  const [liveUpload, setLiveUpload] = useState(0)
  const [livePing, setLivePing] = useState(0)
  const [progress, setProgress] = useState(0)
  const abortRef = useRef<AbortController | null>(null)

  const measurePing = useCallback(async (): Promise<{ ping: number; jitter: number }> => {
    const samples: number[] = []
    const endpoint = 'https://speed.cloudflare.com/__down?bytes=0'

    for (let i = 0; i < 6; i++) {
      const start = performance.now()
      try {
        await fetch(endpoint, {
          method: 'GET',
          cache: 'no-store',
          signal: abortRef.current?.signal,
        })
        const rtt = performance.now() - start
        samples.push(rtt)
        setLivePing(Math.round(rtt))
        await new Promise((r) => setTimeout(r, 150))
      } catch {
        break
      }
    }

    if (samples.length === 0) return { ping: 0, jitter: 0 }

    // Drop first sample (connection warmup)
    const valid = samples.slice(1)
    const ping = valid.reduce((a, b) => a + b, 0) / valid.length
    const jitter =
      valid.length > 1
        ? valid.reduce((sum, v, i, arr) => {
            if (i === 0) return sum
            return sum + Math.abs(v - arr[i - 1])
          }, 0) / (valid.length - 1)
        : 0

    return { ping: Math.round(ping), jitter: Math.round(jitter) }
  }, [])

  const measureDownload = useCallback(async (): Promise<number> => {
    const DURATION_MS = 8000
    const start = performance.now()
    let totalBytes = 0
    let lastUpdate = start

    const controllers = DOWNLOAD_URLS.map(() => new AbortController())
    const parentSignal = abortRef.current?.signal
    if (parentSignal) {
      parentSignal.addEventListener('abort', () => controllers.forEach((c) => c.abort()))
    }

    const streams = DOWNLOAD_URLS.map(async (url, idx) => {
      try {
        const res = await fetch(url, {
          cache: 'no-store',
          signal: controllers[idx].signal,
        })
        const reader = res.body?.getReader()
        if (!reader) return

        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          totalBytes += value?.byteLength ?? 0

          const now = performance.now()
          if (now - lastUpdate > 250) {
            const elapsed = (now - start) / 1000
            const mbps = (totalBytes * 8) / elapsed / 1_000_000
            setLiveDownload(parseFloat(mbps.toFixed(1)))
            setProgress(20 + Math.min(40, (elapsed / (DURATION_MS / 1000)) * 40))
            lastUpdate = now
          }

          if (performance.now() - start >= DURATION_MS) {
            reader.cancel()
            break
          }
        }
      } catch {
        // swallow abort errors
      }
    })

    await Promise.allSettled(streams)
    controllers.forEach((c) => c.abort())

    const elapsed = (performance.now() - start) / 1000
    return parseFloat(((totalBytes * 8) / elapsed / 1_000_000).toFixed(2))
  }, [])

  const measureUpload = useCallback(async (): Promise<number> => {
    const CHUNK_SIZE = 2 * 1024 * 1024 // 2MB
    const DURATION_MS = 6000
    const start = performance.now()
    let totalBytes = 0
    let lastUpdate = start

    const generatePayload = (size: number) => {
      const buffer = new Uint8Array(size)
      crypto.getRandomValues(buffer)
      return buffer
    }

    const uploadChunk = async (): Promise<void> => {
      if (performance.now() - start >= DURATION_MS) return
      const payload = generatePayload(CHUNK_SIZE)
      try {
        await fetch(UPLOAD_URL, {
          method: 'POST',
          body: payload,
          headers: { 'Content-Type': 'application/octet-stream' },
          signal: abortRef.current?.signal,
          cache: 'no-store',
        })
        totalBytes += CHUNK_SIZE

        const now = performance.now()
        if (now - lastUpdate > 250) {
          const elapsed = (now - start) / 1000
          const mbps = (totalBytes * 8) / elapsed / 1_000_000
          setLiveUpload(parseFloat(mbps.toFixed(1)))
          setProgress(65 + Math.min(30, (elapsed / (DURATION_MS / 1000)) * 30))
          lastUpdate = now
        }

        await uploadChunk()
      } catch {
        // swallow
      }
    }

    // Run 3 concurrent upload streams
    await Promise.allSettled([uploadChunk(), uploadChunk(), uploadChunk()])

    const elapsed = (performance.now() - start) / 1000
    return parseFloat(((totalBytes * 8) / elapsed / 1_000_000).toFixed(2))
  }, [])

  const startTest = useCallback(async () => {
    abortRef.current = new AbortController()
    setPhase('ping')
    setResult(INITIAL_RESULT)
    setLiveDownload(0)
    setLiveUpload(0)
    setLivePing(0)
    setProgress(5)

    try {
      // Phase 1: Ping
      setPhase('ping')
      setProgress(10)
      const { ping, jitter } = await measurePing()
      setProgress(20)

      // Phase 2: Download
      setPhase('download')
      const downloadMbps = await measureDownload()
      setProgress(60)

      // Phase 3: Upload
      setPhase('upload')
      const uploadMbps = await measureUpload()
      setProgress(98)

      const finalResult: SpeedTestResult = {
        downloadMbps,
        uploadMbps,
        pingMs: ping,
        jitterMs: jitter,
      }

      setResult(finalResult)
      setLiveDownload(downloadMbps)
      setLiveUpload(uploadMbps)
      setLivePing(ping)
      setProgress(100)
      setPhase('done')
    } catch (err: any) {
      if (err?.name !== 'AbortError') {
        setPhase('error')
      }
    }
  }, [measurePing, measureDownload, measureUpload])

  const reset = useCallback(() => {
    abortRef.current?.abort()
    setPhase('idle')
    setResult(INITIAL_RESULT)
    setLiveDownload(0)
    setLiveUpload(0)
    setLivePing(0)
    setProgress(0)
  }, [])

  return {
    phase,
    result,
    liveDownload,
    liveUpload,
    livePing,
    progress,
    startTest,
    reset,
  }
}
