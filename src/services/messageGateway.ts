/**
 * Message Gateway Service
 *
 * Unified processing layer for API responses and SignalR messages.
 * Provides a rules engine for side effects based on valueType/valueTypeName.
 */

// Rules registry - Map of rule ID to rule object
const rules = new Map<string, Rule>()

// Enable debug logging in development
const DEBUG = import.meta.env.DEV

export interface ActionMetadata {
  groupname?: string
  procedure?: string
  status?: string
  valueType?: string
  valueTypeName?: string
  message?: string
  IsWallet?: boolean
}

export interface NormalizedResponse {
  statusResponse: unknown
  action: ActionMetadata | null
  actionArray: ActionMetadata[]
  value: unknown[]
  raw: unknown
  source?: string
}

export interface Rule {
  id: string
  valueType?: string
  valueTypeName?: string
  handler: (action: ActionMetadata | null, value: unknown[], source: string, normalized: NormalizedResponse) => void | Promise<void>
  priority: number
}

interface RuleInput {
  id: string
  valueType?: string
  valueTypeName?: string
  handler: (action: ActionMetadata | null, value: unknown[], source: string, normalized: NormalizedResponse) => void | Promise<void>
  priority?: number
}

/**
 * Normalize response data from various formats into a consistent structure
 * Handles both API responses and SignalR messages
 */
export function normalizeResponse(rawData: unknown): NormalizedResponse | null {
  if (!rawData) return null

  const data = rawData as Record<string, unknown>

  // Handle nested dataPayload structure (API responses)
  const payload = (data.dataPayload || data) as Record<string, unknown>

  // Extract action array - could be at different levels
  let actionArray = (payload.action || data.action || []) as ActionMetadata[]
  if (!Array.isArray(actionArray)) {
    actionArray = [actionArray as ActionMetadata]
  }

  // Get first action (primary action metadata)
  const action = actionArray[0] || null

  // Extract value array - normalize to always be an array
  let value = (payload.value || data.value || []) as unknown[]
  if (!Array.isArray(value)) {
    value = [value]
  }

  // Extract status response if present
  const statusResponse = data.statusResponse || null

  return {
    statusResponse,
    action,
    actionArray,
    value,
    raw: rawData,
  }
}

/**
 * Register a rule for message processing
 */
export function registerRule(rule: RuleInput): () => void {
  if (!rule.id) {
    throw new Error('Rule must have an id')
  }
  if (!rule.handler || typeof rule.handler !== 'function') {
    throw new Error('Rule must have a handler function')
  }
  if (!rule.valueType && !rule.valueTypeName) {
    throw new Error('Rule must have either valueType or valueTypeName')
  }

  const normalizedRule: Rule = {
    ...rule,
    priority: rule.priority ?? 0,
    valueType: rule.valueType?.toLowerCase(),
    valueTypeName: rule.valueTypeName?.toLowerCase(),
  }

  rules.set(rule.id, normalizedRule)

  if (DEBUG) {
    console.log(`[MessageGateway] Registered rule: ${rule.id}`, {
      valueType: normalizedRule.valueType,
      valueTypeName: normalizedRule.valueTypeName,
    })
  }

  // Return unregister function
  return () => {
    rules.delete(rule.id)
    if (DEBUG) {
      console.log(`[MessageGateway] Unregistered rule: ${rule.id}`)
    }
  }
}

/**
 * Find rules that match the given action
 */
function findMatchingRules(action: ActionMetadata | null): Rule[] {
  if (!action) return []

  const valueType = action.valueType?.toLowerCase()
  const valueTypeName = action.valueTypeName?.toLowerCase()

  const matching: Rule[] = []

  rules.forEach((rule) => {
    const matchesType = rule.valueType && valueType && rule.valueType === valueType
    const matchesName = rule.valueTypeName && valueTypeName && rule.valueTypeName === valueTypeName

    if (matchesType || matchesName) {
      matching.push(rule)
    }
  })

  // Sort by priority (lower first)
  return matching.sort((a, b) => a.priority - b.priority)
}

/**
 * Execute rules for a normalized message (fire-and-forget)
 */
async function executeRules(normalized: NormalizedResponse, source: string): Promise<void> {
  const { action, value } = normalized
  const matchingRules = findMatchingRules(action)

  if (matchingRules.length === 0) return

  if (DEBUG) {
    console.log(`[MessageGateway] Executing ${matchingRules.length} rules for ${action?.valueTypeName || action?.valueType}`)
  }

  // Execute rules in priority order, but don't wait for completion
  for (const rule of matchingRules) {
    try {
      // Fire and forget - don't await, just catch errors
      Promise.resolve(rule.handler(action, value, source, normalized)).catch((error) => {
        console.error(`[MessageGateway] Rule ${rule.id} error:`, error)
      })
    } catch (error) {
      console.error(`[MessageGateway] Rule ${rule.id} sync error:`, error)
    }
  }
}

/**
 * Process a message through the gateway
 * Normalizes the response and executes matching rules
 */
export function processMessage(rawData: unknown, source: string = 'manual'): NormalizedResponse | null {
  try {
    const normalized = normalizeResponse(rawData)

    if (!normalized) {
      return null
    }

    // Add source to normalized data
    normalized.source = source

    // Execute rules (fire-and-forget, non-blocking)
    executeRules(normalized, source)

    if (DEBUG && normalized.action) {
      console.log(`[MessageGateway] Processed ${source} message:`, {
        valueType: normalized.action.valueType,
        valueTypeName: normalized.action.valueTypeName,
        valueCount: normalized.value?.length,
      })
    }

    return normalized
  } catch (error) {
    console.error('[MessageGateway] Process error:', error)
    return null
  }
}

/**
 * Get all registered rules (for debugging)
 */
export function getRules(): Rule[] {
  return Array.from(rules.values())
}

/**
 * Clear all registered rules
 */
export function clearRules(): void {
  rules.clear()
  if (DEBUG) {
    console.log('[MessageGateway] All rules cleared')
  }
}

/**
 * Initialize default rules for common message types
 */
export function initDefaultRules(): void {
  // Cache linked accounts / wallets user is admin for
  registerRule({
    id: 'cache-linked-accounts',
    valueTypeName: 'WalletsIAmAdminFor',
    priority: 10,
    handler: async (_action, value) => {
      if (value && value.length > 0) {
        localStorage.setItem('linkedAccounts', JSON.stringify(value))
      }
    },
  })

  // Cache buddy list
  registerRule({
    id: 'cache-buddies',
    valueTypeName: 'BuddiesList',
    priority: 10,
    handler: async (_action, value) => {
      if (value && value.length > 0) {
        localStorage.setItem('buddies', JSON.stringify(value))
      }
    },
  })

  if (DEBUG) {
    console.log('[MessageGateway] Default rules initialized')
  }
}

/**
 * Register a simple cache rule using localStorage
 */
export function registerCacheRule(valueTypeName: string, cacheKey: string): () => void {
  return registerRule({
    id: `cache-${valueTypeName.toLowerCase()}`,
    valueTypeName,
    priority: 10,
    handler: async (_action, value) => {
      if (value && value.length > 0) {
        localStorage.setItem(cacheKey, JSON.stringify({ data: value, timestamp: Date.now() }))
      }
    },
  })
}

/**
 * Register a logging rule for specific message types
 */
export function registerLogRule(valueTypeName: string, label?: string): () => void {
  return registerRule({
    id: `log-${valueTypeName.toLowerCase()}`,
    valueTypeName,
    priority: 0,
    handler: (action, value, source) => {
      console.log(`[${label || valueTypeName}] ${source}:`, { action, value })
    },
  })
}
