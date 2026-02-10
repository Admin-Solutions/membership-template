# CLAUDE.md

## Project Overview

Universal Membership App ("The Black Hole") — a React + TypeScript SPA for a Raiders-themed membership platform with real-time messaging, push notifications, and wallet integration.

## Tech Stack

- **Framework:** React 19, TypeScript 5.9, Vite 7
- **Styling:** Tailwind CSS 4, Framer Motion
- **State:** Redux Toolkit (store in `src/store/`)
- **Routing:** React Router DOM (HashRouter)
- **Real-time:** Microsoft SignalR (WebSocket)
- **HTTP:** Axios
- **Icons:** Lucide React

## Commands

- `npm run dev` — Start dev server (Vite + HMR)
- `npm run build` — Type-check (`tsc -b`) then Vite build
- `npm run lint` — ESLint
- `npm run preview` — Preview production build

No test framework is currently configured.

## Project Structure

```
src/
├── pages/          # Route pages: Home, Hub, News, Wallet, Benefits, Profile
├── components/     # Reusable UI (Header, Footer, NotificationPanel, LazyWallet, etc.)
├── store/          # Redux store, slices (membershipSlice), hooks, config
├── services/       # signalRService, notificationService, messageGateway
├── utils/          # helpers, hubNavigation
├── hooks/          # useScrollBehavior
├── context/        # NotificationContext
├── brand/          # Brand config (Raiders black/silver theme)
├── App.tsx         # Root component with routes
├── main.tsx        # Entry point with providers (Redux, Router, Viewport, Notifications)
└── index.css       # Global styles + Tailwind
```

## Architecture Notes

- **API pattern:** All API calls POST to `/api/universalapi/process` with an `endPointGUID` to distinguish operations. Config in `src/store/config.ts` extracts `pmc` (PageMonkey Code) from meta tags.
- **Providers:** `<Provider store>` → `<HashRouter>` → `<ViewportProvider>` → `<NotificationProvider>` → `<App>`
- **SignalR:** Auto-reconnecting WebSocket with exponential backoff and group-based subscriptions (`src/services/signalRService.ts`)
- **Message Gateway:** Rule-based message routing engine (`src/services/messageGateway.ts`)
- **Brand theming:** Centralized in `src/brand/brand-config.ts` — colors, gradients, shadows, animation durations, typography (Oswald headings, Open Sans body)

## Dev Environment

- Vite proxies `/api` requests to `https://seemynft.page` in development
- Build outputs use `membership-app` prefix for consistent chunk naming
- Strict TypeScript enabled (`noUnusedLocals`, `noUnusedParameters`)
