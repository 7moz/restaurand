import SockJS from 'sockjs-client'
import { Client, type StompSubscription } from '@stomp/stompjs'

const WS_URL = import.meta.env.VITE_WS_URL ?? 'http://localhost:8081/resto-backend/ws'

type MessageHandler<T> = (payload: T) => void

export class OrderWebSocketClient {
  private client: Client | null = null
  private connected = false

  connect(onConnect?: () => void, onError?: (error: string) => void) {
    if (this.client?.connected) {
      this.connected = true
      onConnect?.()
      return
    }

    const client = new Client({
      webSocketFactory: () => {
        const options: any = {
          transportOptions: {
            'xhr-streaming': { withCredentials: true },
            'xhr-polling': { withCredentials: true },
            'iframe-xhr-polling': { withCredentials: true },
          },
        }

        return new SockJS(WS_URL, undefined, options) as WebSocket
      },
      reconnectDelay: 0,
      debug: () => undefined,
      onConnect: () => {
        this.client = client
        this.connected = true
        onConnect?.()
      },
      onStompError: (frame) => {
        this.connected = false
        onError?.(frame.headers.message ?? 'WebSocket connection error')
      },
      onWebSocketError: () => {
        this.connected = false
        onError?.('WebSocket connection error')
      },
      onWebSocketClose: () => {
        this.connected = false
      },
    })

    client.activate()

    this.client = client
  }

  isConnected() {
    return this.connected && Boolean(this.client?.connected)
  }

  subscribe<T>(destination: string, handler: MessageHandler<T>): StompSubscription | null {
    if (!this.client || !this.client.connected) {
      return null
    }

    return this.client.subscribe(destination, (message) => {
      if (!message.body) {
        return
      }

      try {
        handler(JSON.parse(message.body) as T)
      } catch {
        // Ignore malformed payloads to keep the UI responsive.
      }
    })
  }

  disconnect() {
    if (this.client) {
      void this.client.deactivate()
    }

    this.client = null
    this.connected = false
  }
}
