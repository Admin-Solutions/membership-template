import * as signalR from '@microsoft/signalr'
import { walletGUID } from '../store/config'
import { processMessage } from './messageGateway'

// SignalR Hub URL
const SIGNALR_HUB_URL = 'https://website.admin.solutions/signalrUniversalHub'

// Connection state
let connection: signalR.HubConnection | null = null
let isConnecting = false
let reconnectAttempts = 0
const MAX_RECONNECT_ATTEMPTS = 5
const RECONNECT_DELAY = 3000

// Event handlers registry
type EventHandler = (data: unknown) => void
const eventHandlers = new Map<string, Set<EventHandler>>()

/**
 * Get or create the SignalR connection
 */
function getConnection(): signalR.HubConnection {
  if (connection) return connection

  connection = new signalR.HubConnectionBuilder()
    .withUrl(SIGNALR_HUB_URL, {
      skipNegotiation: true,
      transport: signalR.HttpTransportType.WebSockets,
    })
    .withAutomaticReconnect({
      nextRetryDelayInMilliseconds: (retryContext) => {
        if (retryContext.previousRetryCount >= MAX_RECONNECT_ATTEMPTS) {
          return null // Stop reconnecting
        }
        return Math.min(1000 * Math.pow(2, retryContext.previousRetryCount), 30000)
      },
    })
    .configureLogging(import.meta.env.DEV ? signalR.LogLevel.Information : signalR.LogLevel.Error)
    .build()

  // Set up connection event handlers
  connection.onreconnecting((error) => {
    console.log('[SignalR] Reconnecting...', error?.message)
    notifyHandlers('connectionStateChanged', { state: 'reconnecting', error })
  })

  connection.onreconnected((connectionId) => {
    console.log('[SignalR] Reconnected:', connectionId)
    reconnectAttempts = 0
    joinWalletGroups()
    notifyHandlers('connectionStateChanged', { state: 'connected', connectionId })
  })

  connection.onclose((error) => {
    console.log('[SignalR] Connection closed:', error?.message)
    notifyHandlers('connectionStateChanged', { state: 'disconnected', error })
  })

  // Set up message handler for broadcasts
  connection.on('ReceiveMessage', (message: unknown) => {
    if (import.meta.env.DEV) {
      console.log('[SignalR] Received message:', message)
    }
    handleIncomingMessage(message)
  })

  // Alternative message handler name
  connection.on('broadcastMessage', (message: unknown) => {
    if (import.meta.env.DEV) {
      console.log('[SignalR] Received broadcast:', message)
    }
    handleIncomingMessage(message)
  })

  // Universal hub notification handler
  connection.on('ReceiveNotification', (message: unknown) => {
    if (import.meta.env.DEV) {
      console.log('[SignalR] Received notification:', message)
    }
    handleIncomingMessage(message)
  })

  // Universal hub subscription updates handler
  connection.on('SubscribeToUniversalUpdates', (groupname: string, data: unknown) => {
    if (import.meta.env.DEV) {
      console.log('[SignalR] Received universal update from group:', groupname, data)
    }
    // Parse data if it's a string
    const parsedData = typeof data === 'string' ? JSON.parse(data) : data
    handleIncomingMessage(parsedData)
  })

  return connection
}

/**
 * Handle incoming SignalR messages and route to appropriate handlers
 */
function handleIncomingMessage(message: unknown): void {
  try {
    // Parse message - only attempt JSON parse if it looks like JSON
    let data: unknown
    if (typeof message === 'string') {
      const trimmed = message.trim()
      if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
        data = JSON.parse(message)
      } else {
        // Non-JSON string (e.g., group IDs, acknowledgements) - skip silently
        if (import.meta.env.DEV) {
          console.log('[SignalR] Received non-JSON message (ignored):', message)
        }
        return
      }
    } else {
      data = message
    }

    // Process through message gateway (fire-and-forget for rules)
    const normalized = processMessage(data, 'signalr')

    // Extract notification type from the message
    const messageData = data as Record<string, unknown>
    const actionArray = (messageData.action as Array<Record<string, unknown>>) || []
    const notificationType = normalized?.action?.valueTypeName || actionArray[0]?.valueTypeName || (messageData.type as string) || 'unknown'

    // Notify all registered handlers with normalized data
    notifyHandlers('message', normalized || data)
    notifyHandlers(notificationType as string, normalized || data)
  } catch (error) {
    console.error('[SignalR] Error handling message:', error)
  }
}

/**
 * Join the wallet's SignalR groups
 */
async function joinWalletGroups(): Promise<void> {
  if (!connection || connection.state !== signalR.HubConnectionState.Connected) {
    return
  }

  const groups: string[] = []

  // Add wallet group
  if (walletGUID) {
    groups.push(walletGUID)
  }

  // Add universal wallet group
  groups.push('606763FB-3FFA-48B8-8A60-52B3D6977916')

  for (const groupName of groups) {
    try {
      await connection.invoke('JoinGroup', groupName)
      if (import.meta.env.DEV) {
        console.log('[SignalR] Joined group:', groupName)
      }
    } catch (error) {
      console.error('[SignalR] Failed to join group:', groupName, error)
    }
  }
}

/**
 * Notify all handlers registered for an event
 */
function notifyHandlers(event: string, data: unknown): void {
  const handlers = eventHandlers.get(event)
  if (handlers) {
    handlers.forEach((handler) => {
      try {
        handler(data)
      } catch (error) {
        console.error('[SignalR] Handler error:', error)
      }
    })
  }
}

/**
 * Start the SignalR connection
 */
export async function startSignalR(): Promise<void> {
  if (isConnecting) return
  if (connection?.state === signalR.HubConnectionState.Connected) return

  isConnecting = true

  try {
    const conn = getConnection()
    await conn.start()
    console.log('[SignalR] Connected')
    reconnectAttempts = 0
    await joinWalletGroups()
    notifyHandlers('connectionStateChanged', { state: 'connected' })
  } catch (error) {
    console.error('[SignalR] Connection failed:', error)
    reconnectAttempts++

    if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
      setTimeout(() => {
        isConnecting = false
        startSignalR()
      }, RECONNECT_DELAY * reconnectAttempts)
    }
  } finally {
    isConnecting = false
  }
}

/**
 * Stop the SignalR connection
 */
export async function stopSignalR(): Promise<void> {
  if (connection) {
    try {
      await connection.stop()
      console.log('[SignalR] Disconnected')
    } catch (error) {
      console.error('[SignalR] Error stopping:', error)
    }
  }
}

/**
 * Get the current connection state
 */
export function getConnectionState(): 'connected' | 'connecting' | 'disconnected' {
  if (!connection) return 'disconnected'
  switch (connection.state) {
    case signalR.HubConnectionState.Connected:
      return 'connected'
    case signalR.HubConnectionState.Connecting:
    case signalR.HubConnectionState.Reconnecting:
      return 'connecting'
    default:
      return 'disconnected'
  }
}

/**
 * Register an event handler
 * @param event - Event name ('message', 'connectionStateChanged', or specific notification types)
 * @param handler - Handler function
 * @returns Unsubscribe function
 */
export function onSignalREvent(event: string, handler: EventHandler): () => void {
  if (!eventHandlers.has(event)) {
    eventHandlers.set(event, new Set())
  }
  eventHandlers.get(event)!.add(handler)

  // Return unsubscribe function
  return () => {
    const handlers = eventHandlers.get(event)
    if (handlers) {
      handlers.delete(handler)
    }
  }
}

/**
 * Send a message through SignalR (if needed)
 */
export async function sendMessage(methodName: string, ...args: unknown[]): Promise<void> {
  if (!connection || connection.state !== signalR.HubConnectionState.Connected) {
    throw new Error('SignalR not connected')
  }

  try {
    await connection.invoke(methodName, ...args)
  } catch (error) {
    console.error('[SignalR] Send error:', error)
    throw error
  }
}
