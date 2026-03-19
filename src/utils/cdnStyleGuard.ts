/**
 * cdnStyleGuard — CSS isolation for CDN-loaded bundles (mountable-wallet, etc.)
 *
 * CDN bundles inject their own <style>/<link> tags into document.head. Those
 * tags survive component unmount and override the host app's Tailwind CSS
 * custom properties, corrupting fonts, colors, and layout.
 *
 * Solution: track CDN-marked style elements while at least one CDN sheet is
 * open. When the last sheet closes, disable all tracked elements. When any
 * sheet re-opens, re-enable them instantly.
 *
 * CDN bundles must mark their injected <style> elements with a known attribute:
 *   mountable-wallet → data-mw-styles=""
 */

const CDN_STYLE_ATTRS = ['data-mw-styles']

const trackedStyles = new Set<Element>()
let observer: MutationObserver | null = null
let openCount = 0

function isCdnStyle(node: Element): boolean {
  return CDN_STYLE_ATTRS.some((attr) => node.hasAttribute?.(attr))
}

function queryCdnStyles(): NodeListOf<Element> {
  return document.head.querySelectorAll(
    CDN_STYLE_ATTRS.map((attr) => `[${attr}]`).join(', '),
  )
}

function startObserver() {
  if (observer) return
  observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (
          node.nodeType === 1 &&
          ((node as Element).tagName === 'STYLE' ||
            ((node as Element).tagName === 'LINK' &&
              (node as Element).getAttribute('rel') === 'stylesheet')) &&
          isCdnStyle(node as Element)
        ) {
          trackedStyles.add(node as Element)
        }
      }
    }
  })
  observer.observe(document.head, { childList: true })
}

function stopObserver() {
  observer?.disconnect()
  observer = null
}

/** Call immediately before injecting a CDN <script> so synchronously-added styles are captured. */
export function startCapturingCdnStyles() {
  startObserver()
}

/** Call when a CDN sheet opens. Re-enables captured styles and starts the observer. */
export function acquireCdnStyleGuard() {
  openCount++
  queryCdnStyles().forEach((el) => { (el as HTMLStyleElement).disabled = false })
  trackedStyles.forEach((el) => {
    if (document.head.contains(el)) {
      (el as HTMLStyleElement).disabled = false
    } else {
      trackedStyles.delete(el)
    }
  })
  startObserver()
}

/** Call when a CDN sheet closes. Disables all CDN-marked styles when the last sheet closes. */
export function releaseCdnStyleGuard() {
  openCount = Math.max(0, openCount - 1)
  if (openCount === 0) {
    stopObserver()
    queryCdnStyles().forEach((el) => { (el as HTMLStyleElement).disabled = true })
    trackedStyles.forEach((el) => { (el as HTMLStyleElement).disabled = true })
  }
}
