import { useEffect, useRef, useCallback } from 'react'
import { io, Socket } from 'socket.io-client'
import type { SpeedTestRecord } from '../lib/types'

const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:3001'

interface UseSocketOptions {
  onNewTest?: (test: SpeedTestRecord) => void
  enabled?: boolean
}

export function useSocket({ onNewTest, enabled = true }: UseSocketOptions) {
  const socketRef = useRef<Socket | null>(null)
  const callbackRef = useRef(onNewTest)
  callbackRef.current = onNewTest

  useEffect(() => {
    if (!enabled) return

    const socket = io(WS_URL, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    })

    socketRef.current = socket

    socket.on('connect', () => {
      console.log('[Socket] Connected:', socket.id)
    })

    socket.on('test:new', (data: SpeedTestRecord) => {
      callbackRef.current?.(data)
    })

    socket.on('disconnect', () => {
      console.log('[Socket] Disconnected')
    })

    socket.on('connect_error', (err) => {
      console.warn('[Socket] Connection error:', err.message)
    })

    return () => {
      socket.disconnect()
      socketRef.current = null
    }
  }, [enabled])

  const emit = useCallback((event: string, data: any) => {
    socketRef.current?.emit(event, data)
  }, [])

  return { emit }
}
