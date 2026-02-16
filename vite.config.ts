import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'

// ── Shared cookie file ──────────────────────────────────────────
// nexus-ui writes authenticated cookies here after login.
// This project reads them so both dev servers share the same session.
const SHARED_COOKIE_FILE = join(tmpdir(), 'seemynft-dev-cookies.json')

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd())

  // ── Dev Bootstrap ───────────────────────────────────────────────
  // On dev server startup, fetch the production token page to:
  //   1. Extract meta tags (PMC, og:url, og:title)
  //   2. Extract window.eventInfo + window.__BOOTSTRAP__
  //   3. Capture HTTP-only cookies → forward with proxied /api requests
  // This eliminates manual PMC/JWT copying. Just set VITE_TOKEN_GUID.
  const cookieJar = new Map<string, string>()
  const bootstrapCache = new Map<string, string>() // tokenGuid (uppercase) → injection HTML
  const GUID_RE = /\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i

  /** Load cookies from the shared file written by nexus-ui */
  function loadSharedCookies() {
    try {
      const data = JSON.parse(readFileSync(SHARED_COOKIE_FILE, 'utf-8'))
      let loaded = 0
      for (const [name, nv] of Object.entries(data)) {
        if (!cookieJar.has(name)) loaded++
        cookieJar.set(name, nv as string)
      }
      if (loaded > 0) {
        console.log(`  [shared-cookies] Loaded ${loaded} new cookie(s) from nexus-ui`)
      }
    } catch { /* file doesn't exist yet — that's fine */ }
  }

  /** Rebuild the Cookie header string from all cookies in the jar. */
  function getCookieHeader() {
    loadSharedCookies()
    return Array.from(cookieJar.values()).join('; ')
  }

  /** Parse Set-Cookie headers and merge into the jar. */
  function mergeSetCookies(setCookies: string | string[] | undefined) {
    if (!setCookies) return
    const list = Array.isArray(setCookies) ? setCookies : [setCookies]
    for (const raw of list) {
      const nameValue = raw.split(';')[0]
      const eqIdx = nameValue.indexOf('=')
      if (eqIdx > 0) {
        const name = nameValue.substring(0, eqIdx).trim()
        const value = nameValue.substring(eqIdx + 1)
        const lower = raw.toLowerCase()
        const isExpired = /max-age\s*=\s*0/.test(lower) ||
          /expires\s*=\s*thu,\s*01[- ]jan[- ]1970/.test(lower) ||
          value === ''
        if (isExpired) {
          cookieJar.delete(name)
        } else {
          cookieJar.set(name, nameValue)
        }
      }
    }
  }

  /** Extract a JS object literal using brace-depth counting */
  function extractObjectLiteral(html: string, startIdx: number): string | null {
    const braceStart = html.indexOf('{', startIdx)
    if (braceStart === -1) return null
    let depth = 0
    for (let i = braceStart; i < html.length; i++) {
      if (html[i] === '{') depth++
      else if (html[i] === '}') {
        depth--
        if (depth === 0) {
          return html.substring(braceStart, i + 1)
        }
      }
    }
    return null
  }

  /** Extract meta tags + bootstrap scripts from production HTML */
  function extractBootstrapHTML(html: string): string | null {
    const parts: string[] = []

    // 1. Extract meta tags
    const pmcMatch = html.match(/<meta\s+pagemonkeycode="pagemonkeycode-code"\s+content="([^"]*)"[^>]*>/i)
    if (pmcMatch) {
      parts.push(`<meta pagemonkeycode="pagemonkeycode-code" content="${pmcMatch[1]}" />`)
    }

    const ogUrlMatch = html.match(/<meta\s+property="og:url"\s+content="([^"]*)"[^>]*>/i)
    if (ogUrlMatch) {
      parts.push(`<meta property="og:url" content="${ogUrlMatch[1]}" />`)
    }

    const ogTitleMatch = html.match(/<meta\s+property="og:title"\s+content="([^"]*)"[^>]*>/i)
    if (ogTitleMatch) {
      parts.push(`<meta property="og:title" content="${ogTitleMatch[1]}" />`)
    }

    // 2. Extract window.eventInfo and window.__BOOTSTRAP__
    const scriptParts: string[] = []

    const eventInfoIdx = html.indexOf('window.eventInfo')
    if (eventInfoIdx !== -1) {
      const obj = extractObjectLiteral(html, eventInfoIdx)
      if (obj) {
        let raw = obj
        raw = raw.replace(/stringToBoolean\(\s*"True"\s*\)/gi, 'true')
        raw = raw.replace(/stringToBoolean\(\s*"False"\s*\)/gi, 'false')
        scriptParts.push(`window.eventInfo = ${raw};`)
      }
    }

    const bootstrapIdx = html.indexOf('window.__BOOTSTRAP__')
    if (bootstrapIdx !== -1) {
      const obj = extractObjectLiteral(html, bootstrapIdx)
      if (obj) {
        let raw = obj
        raw = raw.replace(/stringToBoolean\(\s*"True"\s*\)/gi, 'true')
        raw = raw.replace(/stringToBoolean\(\s*"False"\s*\)/gi, 'false')
        scriptParts.push(`window.__BOOTSTRAP__ = ${raw};`)
      }
    }

    if (scriptParts.length > 0) {
      parts.push(`<script>\n      ${scriptParts.join('\n      ')}\n    </script>`)
    }

    return parts.length > 0 ? parts.join('\n    ') : null
  }

  /** Fetch production page for a token, extract bootstrap + cookies, cache it */
  async function fetchBootstrap(guid: string, label = '') {
    const upper = guid.toUpperCase()
    const pageUrl = `https://seemynft.page/mytoken/${guid}`
    const tag = label ? ` (${label})` : ''
    console.log(`\n  [dev-bootstrap] Fetching ${pageUrl}${tag} ...`)

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 10000)

    const res = await fetch(pageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml',
        ...(cookieJar.size > 0 ? { 'Cookie': getCookieHeader() } : {}),
      },
      redirect: 'follow',
      signal: controller.signal,
    })
    clearTimeout(timeout)

    if (!res.ok) {
      console.error(`  [dev-bootstrap] HTTP ${res.status}`)
      return null
    }

    mergeSetCookies(res.headers.getSetCookie?.() || [])

    const html = await res.text()
    const injection = extractBootstrapHTML(html)

    if (injection) {
      bootstrapCache.set(upper, injection)
      console.log(`  [dev-bootstrap] Cached bootstrap for ${upper} (${cookieJar.size} cookies: ${Array.from(cookieJar.keys()).join(', ')})`)
    } else {
      console.warn('  [dev-bootstrap] No bootstrap data found in HTML — falling back to env vars')
    }
    return injection
  }

  return {
    plugins: [
      react(),
      tailwindcss(),

      // Dev-only plugin: auto-fetch production bootstrap + cookies
      (mode === 'development' && !!env.VITE_TOKEN_GUID) && ((): Plugin => ({
        name: 'dev-bootstrap',

        async configureServer(server) {
          const defaultGuid = env.VITE_TOKEN_GUID.toUpperCase()

          // Load cookies from nexus-ui's shared file (if user is already logged in there)
          loadSharedCookies()

          // Initial fetch on server startup (with shared cookies if available)
          try {
            await fetchBootstrap(defaultGuid)
          } catch (err: unknown) {
            const msg = err instanceof Error
              ? (err.name === 'AbortError' ? 'Fetch timed out (10s)' : err.message)
              : String(err)
            console.error(`  [dev-bootstrap] ${msg} — falling back to env vars\n`)
          }

          // Endpoint to re-fetch bootstrap after login (with authenticated cookies)
          server.middlewares.use('/__dev/refresh-bootstrap', async (_req: unknown, res: { writeHead: (code: number, headers: Record<string, string>) => void; end: (body: string) => void }) => {
            try {
              bootstrapCache.clear()
              const bootstrap = await fetchBootstrap(defaultGuid, 'post-login refresh')
              res.writeHead(200, { 'Content-Type': 'application/json' })
              res.end(JSON.stringify({ success: !!bootstrap }))
            } catch (err: unknown) {
              const msg = err instanceof Error ? err.message : String(err)
              console.error(`  [dev-bootstrap] Refresh failed: ${msg}`)
              res.writeHead(500, { 'Content-Type': 'application/json' })
              res.end(JSON.stringify({ success: false }))
            }
          })
        },

        transformIndexHtml: {
          order: 'pre',
          async handler(html, ctx) {
            // Extract token GUID from the URL path, fall back to default
            const guidMatch = ctx?.originalUrl?.match(GUID_RE)
            const requestedGuid = guidMatch
              ? guidMatch[1].toUpperCase()
              : env.VITE_TOKEN_GUID.toUpperCase()

            // Look up cache, fetch on demand if this is a new token or cache was cleared
            let injection = bootstrapCache.get(requestedGuid)
            if (!injection) {
              try {
                injection = await fetchBootstrap(requestedGuid, 'on-demand') ?? undefined
              } catch (err: unknown) {
                const msg = err instanceof Error ? err.message : String(err)
                console.error(`  [dev-bootstrap] Fetch failed for ${requestedGuid}: ${msg}`)
              }
            }

            if (!injection) return html

            return html.replace(
              '<!-- SERVER_BOOTSTRAP_INJECTION_POINT: Server replaces this with meta tags + bootstrap scripts -->',
              injection,
            )
          },
        },
      }))()
    ].filter(Boolean),

    server: {
      proxy: {
        '/api': {
          target: 'https://seemynft.page',
          changeOrigin: true,
          secure: true,
          configure: (proxy) => {
            // Forward session cookies with every proxied API request
            proxy.on('proxyReq', (proxyReq) => {
              const cookies = getCookieHeader()
              if (cookies) {
                proxyReq.setHeader('Cookie', cookies)
              }
              console.log(`  [dev-proxy] → ${proxyReq.method} ${proxyReq.path} (${cookieJar.size} cookies: ${Array.from(cookieJar.keys()).join(', ')})`)
            })
            // Capture Set-Cookie from API responses (e.g. login, logout)
            // and clear bootstrap cache so next page load gets fresh auth state
            proxy.on('proxyRes', (proxyRes) => {
              const setCookies = proxyRes.headers['set-cookie']
              if (setCookies) {
                const before = getCookieHeader()
                mergeSetCookies(setCookies)
                const after = getCookieHeader()
                if (before !== after) {
                  bootstrapCache.clear()
                  console.log(`  [dev-proxy] Cookies changed → bootstrap cache cleared (${cookieJar.size} cookie(s))`)
                }
              }
            })
          },
        },
      },
    },

    build: {
      // Output consistent file names for easier server integration
      rollupOptions: {
        output: {
          entryFileNames: 'assets/membership-app.js',
          chunkFileNames: 'assets/membership-[name].js',
          assetFileNames: 'assets/membership-app.[ext]'
        }
      }
    },

    // Base path - adjust if app is served from a subdirectory
    base: './'
  }
})
