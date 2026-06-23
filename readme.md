# Chat Client

Real-time messaging frontend built with **React 19**, **Vite 8**, **Tailwind CSS v4**, **Socket.IO**, and **Zustand**.

---

## Tech Stack

| Layer       | Library                                  |
|-------------|------------------------------------------|
| Framework   | React 19 + Vite 8                        |
| Styling     | Tailwind CSS v4 + Radix UI primitives    |
| State       | Zustand (6 stores)                       |
| Routing     | React Router v7                          |
| WebSocket   | Socket.IO client v4                      |
| HTTP        | Axios (interceptors, token refresh)      |
| Animation   | Framer Motion                            |
| Emoji Picker| emoji-picker-react                       |
| Markdown    | react-markdown + remark-gfm              |
| Virtualized | react-virtuoso                           |

---

## Project Structure

```
chat-client/
├── index.html
├── vite.config.js
├── package.json
├── eslint.config.js
├── dockerfile
├── docker-compose.yml
└── src/
    ├── main.jsx                    # Entry point
    ├── App.jsx                     # Router + auth gate
    ├── index.css                   # Tailwind + 6 theme definitions
    ├── api/
    │   ├── auth.js                 # Signup, signin, logout, refresh, profile
    │   ├── conversationApi.js      # CRUD conversations
    │   └── messageApi.js           # CRUD messages
    ├── components/
    │   ├── ProtectedRoute.jsx      # Auth guard / guest guard
    │   ├── SocketManager.jsx       # Socket lifecycle + room join/leave
    │   ├── ThemeSelector.jsx       # Palette picker (6 themes)
    │   ├── ThemeToggle.jsx         # Dark/light toggle
    │   └── ui/                     # Radix primitives (button, input, avatar, etc.)
    ├── pages/
    │   ├── Layout.jsx              # Main app shell + swipe navigation
    │   ├── NavigationRail.jsx      # Mobile bottom / desktop side nav
    │   ├── Profile.jsx             # Profile view + update + password change
    │   ├── errorPage.jsx           # Error boundary fallback
    │   ├── mode.jsx                # Legacy mode context
    │   ├── auth/
    │   │   ├── authpage.jsx        # Sign in / Sign up tab container
    │   │   ├── signin-form.jsx     # Login form
    │   │   └── signup-form.jsx     # Registration form
    │   └── chat/
    │       ├── ChatHeader.jsx      # Conversation header + profile popdown
    │       ├── ChatWindow.jsx      # Message view orchestrator
    │       ├── EmptyState.jsx      # No conversation selected
    │       ├── FindUsers.jsx       # User search + discovery
    │       ├── MessageBubble.jsx   # Single message bubble
    │       ├── MessageInput.jsx    # Textarea + emoji picker + send
    │       ├── MessageList.jsx     # Virtualized scroll + pagination
    │       ├── Sidebar.jsx         # Conversation list
    │       └── TypingIndicator.jsx # Animated typing dots
    ├── services/
    │   ├── axios.js                # Axios instance + interceptors
    │   └── socket.js               # Socket.IO singleton factory
    ├── store/
    │   ├── useAuthStore.js         # Auth state (user, session, signup/login/logout)
    │   ├── useChatStore.js         # Messages, typing, pagination
    │   ├── useConversationStore.js # Conversation list, active conversation
    │   ├── useModeStore.js         # Navigation mode (chat/users/groups/profile)
    │   ├── useSocketStore.js       # Socket instance, online users
    │   └── useThemeStore.js        # Theme + dark mode
    ├── lib/
    │   └── utils.js                # cn() helper
    └── css/
        └── index3.css              # Fallback stylesheet (unused)
```

---

## Stores (Zustand)

| Store                 | Responsibility                                          |
|-----------------------|---------------------------------------------------------|
| `useAuthStore`        | User authentication, session restore, profile update    |
| `useChatStore`        | Message list, typing indicators, paginated history      |
| `useConversationStore`| Sidebar conversation list, active conversation tracking |
| `useSocketStore`      | Socket.IO connection lifecycle, online user set         |
| `useModeStore`        | Active navigation mode                                  |
| `useThemeStore`       | Base color theme (1-6) + dark/light toggle              |

---

## API Endpoints (proxied via Vite)

| Proxy Path         | Target                       | Service     |
|--------------------|------------------------------|-------------|
| `/socket.io`       | `http://localhost:3002` (ws) | Chat socket |
| `/user`            | `http://localhost:3001/chat`  | User REST   |
| `/conversations`   | `http://localhost:3002/chat`  | Chat REST   |
| `/messages`        | `http://localhost:3002/chat`  | Chat REST   |

---

## Socket.IO Events

| Event (outgoing)      | Payload                                   | Description                    |
|-----------------------|-------------------------------------------|--------------------------------|
| `join_conversation`   | `conversationId`                          | Join a conversation room       |
| `leave_conversation`  | `conversationId`                          | Leave a conversation room      |
| `send_message`        | `{ conversationId, text, attachments, clientMessageId }` | Send a message (ack) |
| `typing`              | `{ conversationId, isTyping }`            | Typing indicator               |
| `mark_read`           | `{ conversationId, messageId }`           | Mark messages as read          |
| `check_online`        | `targetUserId`                            | Check online status (ack)      |

| Event (incoming)      | Payload                                   | Description                    |
|-----------------------|-------------------------------------------|--------------------------------|
| `new_message`         | `message` object                          | New message in active room     |
| `messages_read`       | `{ conversationId, messageId, readByUserId }` | Receipt update          |
| `typing`              | `{ userId, conversationId, isTyping }`    | Remote typing indicator        |
| `message_deleted`     | `{ messageId, conversationId }`           | Message deleted notification   |
| `user_online`         | `{ userId }`                              | User came online               |
| `user_offline`        | `{ userId }`                              | User went offline              |
| `room_error`          | `{ message }`                             | Room access error              |

---

## Themes

Six built-in themes, each with light + dark variants:

| #  | Name        | Token             |
|----|-------------|-------------------|
| 1  | Classic     | `theme-1` (indigo)|
| 2  | Onyx Black  | `theme-2`         |
| 3  | Emerald     | `theme-3`         |
| 4  | Ocean Blue  | `theme-4`         |
| 5  | Glass/Slate | `theme-5`         |
| 6  | Sunset      | `theme-6` (coral) |

Theme and dark mode preference are persisted in `localStorage`.

---

## Development

```bash
npm install --legacy-peer-deps
npm run dev
```

Starts on `http://localhost:5100` with HMR.

### Build

```bash
npm run build
npm run preview
```

### Lint

```bash
npm run lint
```

### Docker

```bash
docker compose up --build
```

Serves the production build via Nginx on port 5100.
