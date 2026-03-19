import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HashRouter } from "react-router-dom";
import App from "./App";
import ViewportProvider from "./components/ViewportProvider";
import { NotificationProvider } from "./context/NotificationContext";
import { initDevData } from "./dev-data";
import { initDefaultRules } from "./services/messageGateway";
import "./index.css";

// Iframe detection for height fixes (dvh/vh don't work in iframes on iOS)
const isIframe = (() => { try { return window.self !== window.top; } catch { return true; } })();
if (isIframe) document.documentElement.classList.add('nexus-iframe');

// Safe area insets — default to 0px before any NAPP_CONTEXT message arrives (no flash).
// The parent wallet shell sends { type: 'NAPP_CONTEXT', displayMode: 'partial' | 'fullscreen' | 'tab' }
// to tell us whether to apply iOS safe area padding.
const docRoot = document.documentElement;
docRoot.style.setProperty('--safe-area-top', '10px');
docRoot.style.setProperty('--safe-area-bottom', '0px');

window.addEventListener('message', (e) => {
  if (e.data?.type !== 'NAPP_CONTEXT') return;
  const mode = e.data.displayMode;
  if (mode === 'partial') {
    docRoot.style.setProperty('--safe-area-top', '10px');
    docRoot.style.setProperty('--safe-area-bottom', '0px');
  } else if (mode === 'fullscreen' || mode === 'tab') {
    docRoot.style.setProperty('--safe-area-top', 'calc(env(safe-area-inset-top, 0px) + 10px)');
    docRoot.style.setProperty('--safe-area-bottom', 'env(safe-area-inset-bottom, 0px)');
  }
});

// Initialize mock data for local development
initDevData();


// Initialize message gateway rules
initDefaultRules();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <HashRouter>
      <ViewportProvider>
        <NotificationProvider>
          <App />
        </NotificationProvider>
      </ViewportProvider>
    </HashRouter>
  </StrictMode>
);
