# Chat Client

Real-time messaging frontend for the [Chat Server](../Chat-server), built with **React 19**, **Vite 8**, **Tailwind CSS v4**, **Socket.IO**, and **Zustand**.

---

## Features

- Email/password **and** Google OAuth sign-in, with automatic access-token refresh + request queuing
- Real-time 1:1 messaging (optimistic send, delivery/read receipts, typing indicators, presence)
- Virtualized message list (`react-virtuoso`) with infinite scroll for history and follow-on-new-message
- Soft-delete with tombstones, copy (whole message or selection), emoji picker, URL linkification
- Conversation sidebar with online dots, unread badges, "You:" previews, and search
- User search / directory, profile editing (name · bio · avatar URL), password change
- Six color themes + dark/light, persisted

---

## Tech stack

| Concern | Choice |
|---------|--------|
| Framework / build | React 19 · Vite 8 |
| Styling | Tailwind CSS v4 (`@tailwindcss/vite`) · Radix UI primitives |
| State | Zustand (6 single-responsibility stores) |
| Data / realtime | axios (with refresh interceptor) · socket.io-client |
| Routing | react-router-dom 7 |
| List virtualization | react-virtuoso |
| Testing | Vitest · Testing Library · Playwright |

---

## Prerequisites

- **Node.js 20+**
- The **[Chat Server](../Chat-server)** running (userservice `:3001`, chatservice `:3002`) — start it with `docker compose up -d` in `Chat-server/`.

---

## Getting started

```bash
cd chat-client
npm install --legacy-peer-deps    # peer-dep conflicts require this flag
npm run dev                       # http://localhost:5100  (HMR)
```

The dev server runs on **port 5100** and **proxies API/socket traffic to the backend** — no API host is hardcoded in the app.

| Frontend path | Proxied to |
|---------------|-----------|
| `/user/*` | `http://localhost:3001/chat` (userservice) |
| `/conversations`, `/messages` | `http://localhost:3002/chat` (chatservice) |
| `/socket.io` | `http://localhost:3002` (websocket) |

Configured in [`vite.config.js`](./vite.config.js). In production, a reverse proxy must route these paths the same way.

### Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Dev server + HMR |
| `npm run build` | Production build → `dist/` |
| `npm run preview` | Serve the built output |
| `npm run lint` | ESLint |
| `npm test` | Unit + component tests (Vitest) |
| `npm run test:watch` | Vitest watch mode |
| `npm run test:e2e` | Playwright E2E (needs backend running) |
| `npm run test:e2e:install` | Install the Chromium browser for E2E |

---

## Architecture

### State — Zustand stores (`src/store/`)
| Store | Owns |
|-------|------|
| `useAuthStore` | Session restore, current user, profile updates |
| `useConversationStore` | Sidebar list, active conversation, participant hydration |
| `useChatStore` | Open-thread messages, paginated history, **centralized typing state** |
| `useSocketStore` | Socket lifecycle + online-user set |
| `useModeStore` | Nav mode (chat / users / profile) |
| `useThemeStore` | Theme (1–6) + dark/light, persisted to `localStorage` |

### Data flow
- **API layer** (`src/api/`) is a thin wrapper over a single axios instance (`src/services/axios.js`) that attaches the bearer token and performs **single-flight refresh with request queuing** on 401. A 401 from an auth endpoint (`/user/signin`, `/user/signup`) is surfaced as-is (no refresh attempt); a dead refresh dispatches a global `user:signout`.
- **Sockets** (`src/services/socket.js`, `src/components/SocketManager.jsx`) — one connection; incoming events fan out to the stores. On `auth_error` the client refreshes its token and reconnects, or signs out.
- **Chat UI** (`src/pages/chat/`) — `ChatWindow` composes `ChatHeader`, `MessageList` (virtualized, keyed per conversation so it mounts at the bottom), `MessageInput`, and `Sidebar`. `MessageBubble` renders individual messages.

---

## Testing

Three tiers:

```bash
npm test                  # Unit + component (Vitest + Testing Library, jsdom) — no backend needed
npm run test:e2e:install  # one-time: install Chromium
npm run test:e2e          # E2E (Playwright) — needs the backend stack running + seeded users
```

- **Unit** (`src/**/*.test.js`) — stores, API modules, utils.
- **Component** (`src/pages/chat/*.test.jsx`) — `MessageInput`, `MessageBubble`, `Sidebar` via Testing Library.
- **E2E** (`e2e/*.spec.js`, `playwright.config.js`) — login, error handling, protected routes, send-message flow, driven against the real app in Chromium. The Playwright `webServer` reuses a running dev server.

Config: [`vitest.config.js`](./vitest.config.js) (jsdom, automatic JSX runtime, setup in `src/test/setup.js`) and [`playwright.config.js`](./playwright.config.js).

---

## Project structure

```
chat-client/
├── vite.config.js          # dev server + proxy
├── vitest.config.js        # unit/component test config
├── playwright.config.js     # E2E config
├── e2e/                     # Playwright specs
└── src/
    ├── api/                 # auth, conversation, message API wrappers
    ├── services/            # axios instance (+ refresh), socket client
    ├── store/               # Zustand stores
    ├── components/          # SocketManager, ProtectedRoute, Theme*, ui/ (Radix)
    ├── pages/
    │   ├── auth/            # sign-in / sign-up forms + page
    │   ├── chat/            # ChatWindow, MessageList, MessageBubble, MessageInput,
    │   │                    #   Sidebar, FindUsers, ChatHeader, TypingIndicator …
    │   ├── Layout.jsx       # shell + NavigationRail + swipe/back handling
    │   └── Profile.jsx
    ├── lib/utils.js         # cn() class merge
    └── test/setup.js        # jsdom polyfills + jest-dom
```

---

## Notes

- Access token lives in `localStorage`; the refresh token is an httpOnly cookie owned by the userservice.
- Attachments (paperclip) are a UI placeholder — file upload needs object storage on the backend and isn't wired yet.
- Avatars are set by **URL** (Profile → Avatar URL); there's no file-upload pipeline.
