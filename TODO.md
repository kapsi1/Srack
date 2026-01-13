# Snack Full-Stack Transformation TODO

This document outlines the tasks required to convert the existing Figma-based React frontend into a full-stack application using **Node/Express, PostgreSQL (Prisma), and Socket.io**.

## Phase 1: Project Restructuring
- [x] Initialize root `package.json` for workspace management.
- [x] Rename current project root contents to `client/`.
- [x] Create `server/` directory for the backend.
- [x] Set up shared TypeScript configuration.

## Phase 2: Database & Backend Foundation
- [x] Initialize Express server in `server/`.
- [x] Install dependencies: `express`, `cors`, `dotenv`, `prisma`, `@prisma/client`, `socket.io`.
- [x] Initialize Prisma with PostgreSQL provider.
- [x] Define Database Schema:
    - [x] `User` model (id, email, password, username, avatar).
    - [x] `Channel` model (id, name, isPrivate).
    - [x] `Message` model (id, content, senderId, channelId, createdAt).
    - [x] `Reaction` model (id, emoji, messageId, userId).
- [x] Run initial migrations to set up the DB.

## Phase 3: Authentication & Identity
- [x] Implement User Registration/Login API (REST).
- [x] Set up JWT authentication middleware.
- [x] Create "Generate Dummy User" script for development.
- [x] (Frontend) Create Login/Register views.
- [x] (Frontend) Store JWT in localStorage/Cookies.

## Phase 4: Core API (REST)
- [x] **Channels API**:
    - [x] GET `/api/channels` (List all channels).
    - [x] POST `/api/channels` (Create a channel).
- [x] **Messages API**:
    - [x] GET `/api/channels/:id/messages` (Fetch message history for a channel).
    - [x] POST `/api/messages` (Optional, if not using sockets for sending).
- [x] **Users API**:
    - [x] GET `/api/users/me` (Current user profile).
    - [x] GET `/api/users` (List users for DMs).

## Phase 5: Real-time Integration (Socket.io)
- [x] Set up Socket.io server logic in `server/`.
- [x] Implement "Join Room" logic (joining specific channel rooms).
- [x] Implement "Message Sent" event handling (DB save + broadcast).
- [x] Implement "Reaction Updated" event handling.
- [x] (Frontend) Install `socket.io-client`.
- [x] (Frontend) Create a WebSocket provider/context.

## Phase 6: Frontend Data Integration
- [x] Install `axios` and `@tanstack/react-query` for data fetching.
- [x] Replace `initialChannels` static state with API calls.
- [x] Replace `initialMessages` with real data from the selected channel.
- [x] Connect `onSendMessage` and `onAddReaction` hooks to Socket.io events.
- [x] Implement unread counts logic.

## Phase 7: Polish & Advanced Features
- [x] **Direct Messages**: Logic for 1-to-1 rooms.
- [x] **Optimistic Updates**: Use React Query to show messages instantly before DB confirmation.
- [x] **Persistent Auth**: Refresh token logic or session management.

## Phase 8: Deployment
- [ ] Containerize with Docker (optional).
- [ ] Prepare production build for the client.
- [ ] Set up environment variables for production.
