<p align="center">
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=white" alt="React 19"/>
  <img src="https://img.shields.io/badge/TypeScript-5.9-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript"/>
  <img src="https://img.shields.io/badge/Node.js-Express-339933?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js"/>
  <img src="https://img.shields.io/badge/PostgreSQL-Prisma-336791?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL"/>
  <img src="https://img.shields.io/badge/Socket.io-Real--time-010101?style=for-the-badge&logo=socket.io&logoColor=white" alt="Socket.io"/>
</p>

# 🥨 Snack

**A modern, full-featured Slack clone built with React 19, Node.js, Socket.io, and PostgreSQL.**

Snack is a real-time team communication platform that replicates the core functionality of Slack, including channels, direct messages, threads, reactions, mentions, file sharing, and more.

**Deployed at:** [https://snack-six.vercel.app](https://snack-six.vercel.app)

---

## ✨ Features

### Core Messaging
- 💬 **Real-time messaging** — Instant message delivery using Socket.io
- 📢 **Channels** — Public and private channels for team communication
- 🔒 **Direct Messages** — Private 1-on-1 conversations between users

### Conversations
- 🧵 **Message Threads** — Reply to messages in threaded conversations
- 👀 **Threads View** — Consolidated view of all your active threads
- ↪️ **Forward Messages** — Share messages across different channels
- 🗑️ **Delete Messages** — Remove your own messages with confirmation

### Reactions & Mentions
- 😀 **Emoji Reactions** — Add reactions to messages with a full emoji picker
- @️ **User Mentions** — Tag users with `@username` with autocomplete dropdown
- 📬 **Mentions & Reactions View** — Consolidated feed of all your mentions and reactions

### Organization
- ⭐ **Starred Channels** — Quick access to your favorite channels
- 🔖 **Saved Messages** — Bookmark important messages for later
- 🔍 **Channel Search** — Filter messages within the current channel
- ℹ️ **Channel Info** — View channel details and member lists

### Media & Calls
- 📎 **File Attachments** — Share images, videos, and documents via Uploadcare
- 🎤 **Voice Recording** — Record and send voice messages directly
- 📞 **Audio & Video Calls** — Real-time WebRTC calls between users

### Authentication
- 🔐 **JWT Authentication** — Secure user registration and login
- 🔄 **Persistent Sessions** — Stay logged in with refresh tokens

---

## 🏗️ Architecture

Snack follows a modern **monorepo structure** with a clear separation between client and server:

```
snack/
├── client/                 # React 19 frontend (Vite)
│   ├── src/
│   │   ├── components/     # React components
│   │   │   ├── AuthPage.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── ChatArea.tsx
│   │   │   ├── MessageList.tsx
│   │   │   ├── MessageItem.tsx
│   │   │   ├── MessageInput.tsx
│   │   │   ├── ThreadView.tsx
│   │   │   ├── ThreadsListView.tsx
│   │   │   ├── SavedItemsView.tsx
│   │   │   ├── MentionsReactionsView.tsx
│   │   │   └── ...
│   │   ├── context/        # React context providers
│   │   ├── lib/            # API client & utilities
│   │   └── App.tsx         # Main application component
│   └── package.json
│
├── server/                 # Node.js/Express backend
│   ├── src/
│   │   ├── controllers/    # Route handlers
│   │   │   ├── auth.controller.ts
│   │   │   ├── channel.controller.ts
│   │   │   ├── message.controller.ts
│   │   │   ├── saved-message.controller.ts
│   │   │   └── activity.controller.ts
│   │   ├── routes/         # API route definitions
│   │   ├── middleware/     # Express middleware (JWT auth)
│   │   ├── socket.ts       # Socket.io real-time handling
│   │   └── app.ts          # Express app configuration
│   ├── prisma/
│   │   └── schema.prisma   # Database schema
│   └── package.json
│
├── e2e/                    # Playwright end-to-end tests
└── package.json            # Root workspace configuration
```

### Database Schema

The PostgreSQL database is managed with **Prisma ORM** and includes the following models:

| Model | Description |
|-------|-------------|
| `User` | User accounts with email, username, password, and avatar |
| `Channel` | Public, private, and DM channels |
| `Message` | Messages with content, attachments, and thread support |
| `Reaction` | Emoji reactions on messages |
| `SavedMessage` | Bookmarked messages per user |
| `StarredChannel` | Starred channels per user |

### Real-time Communication

Socket.io events power the real-time features:

| Event | Direction | Description |
|-------|-----------|-------------|
| `join:channel` | Client → Server | Join a channel room |
| `leave:channel` | Client → Server | Leave a channel room |
| `message:new` | Server → Client | New message broadcast |
| `message:deleted` | Server → Client | Message deletion broadcast |
| `reaction:updated` | Server → Client | Reaction change broadcast |
| `call-request` | Client → Server → Client | Initiate WebRTC call |
| `call-answer` | Client → Server → Client | Accept WebRTC call |
| `ice-candidate` | Client → Server → Client | Exchange connection candidates |
| `call-rejected` | Client → Server → Client | Call rejection signal |
| `call-ended` | Client → Server → Client | Call termination signal |

---

## 🛠️ Tech Stack

### Frontend
- **React 19** — UI library with latest features
- **TypeScript** — Type-safe development
- **Vite** — Fast build tooling
- **TanStack Query** — Server state management
- **Socket.io Client** — Real-time communication
- **React Router** — Client-side routing
- **Tailwind CSS** — Utility-first styling
- **Lucide React** — Icon library
- **emoji-picker-react** — Emoji picker component
- **Uploadcare** — File upload handling
- **Vitest** — Unit testing framework

### Backend
- **Node.js + Express 5** — HTTP server
- **TypeScript** — Type-safe development
- **Prisma** — PostgreSQL ORM
- **Socket.io** — WebSocket server
- **JWT (jsonwebtoken)** — Authentication
- **bcrypt** — Password hashing

### Testing
- **Vitest** — Unit and integration tests
- **Playwright** — End-to-end testing
- **Testing Library** — React component testing

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ 
- **pnpm** (recommended) or npm
- **PostgreSQL** database (or [Neon](https://neon.tech) for serverless)

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/your-username/snack.git
   cd snack
   ```

2. **Install dependencies**

   ```bash
   pnpm install
   ```

3. **Configure environment variables**

   Create `server/.env`:
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/snack"
   JWT_SECRET="your-super-secret-jwt-key"
   PORT=3001
   ```

   Create `client/.env`:
   ```env
   VITE_API_URL="http://localhost:3001/api"
   ```

4. **Set up the database**

   ```bash
   cd server
   pnpm prisma migrate dev
   ```

5. **Start development servers**

   In one terminal (backend):
   ```bash
   cd server
   pnpm dev
   ```

   In another terminal (frontend):
   ```bash
   cd client
   pnpm dev
   ```

6. **Open the app**

   Navigate to `http://localhost:5173` in your browser.

---

## 🧪 Testing

### Unit Tests

```bash
# Run all tests
pnpm test

# Run client tests
cd client && pnpm test

# Run server tests
cd server && pnpm test
```

### End-to-End Tests

```bash
# Run Playwright tests
pnpm exec playwright test
```

---

## 🌐 Deployment

Snack can be deployed using the following stack:

| Service | Purpose | Provider |
|---------|---------|----------|
| Database | PostgreSQL | [Neon](https://neon.tech) (serverless) |
| Backend | Node.js API | [Koyeb](https://koyeb.com) |
| Frontend | React SPA | [Vercel](https://vercel.com) |

See the [Deployment Guide](./DEPLOYMENT.md) for detailed instructions.

---

## 📋 API Reference

### Authentication
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/register` | POST | Create new account |
| `/api/auth/login` | POST | Authenticate user |

### Users
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/users/me` | GET | Get current user profile |
| `/api/users` | GET | List all users |

### Channels
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/channels` | GET | List all channels |
| `/api/channels` | POST | Create a channel |
| `/api/channels/dm` | POST | Create a DM channel |
| `/api/channels/star` | POST | Toggle channel star |
| `/api/channels/:id/messages` | GET | Get channel messages |

### Messages
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/messages` | POST | Send a message |
| `/api/messages/:id` | DELETE | Delete a message |
| `/api/messages/:id/thread` | GET | Get thread messages |
| `/api/messages/threads` | GET | Get user's threads |

### Activity
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/activity` | GET | Get mentions & reactions |
| `/api/saved-messages` | GET | Get saved messages |
| `/api/saved-messages/toggle` | POST | Toggle message save |

---

## 📄 License

This project is licensed under the MIT License.

---

<p align="center">
  Made with ❤️ using React, Node.js, and Socket.io
</p>
