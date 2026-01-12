# Srack Full-Stack Transformation TODO

This document outlines the tasks required to convert the existing Figma-based React frontend into a full-stack application using **Node/Express, PostgreSQL (Prisma), and Socket.io**.

## Phase 1: Project Restructuring
- [x] Initialize root `package.json` for workspace management.
- [x] Rename current project root contents to `client/`.
- [x] Create `server/` directory for the backend.
- [x] Set up shared TypeScript configuration.

## Phase 2: Database & Backend Foundation
- [ ] Initialize Express server in `server/`.
- [ ] Install dependencies: `express`, `cors`, `dotenv`, `prisma`, `@prisma/client`, `socket.io`.
- [ ] Initialize Prisma with PostgreSQL provider.
- [ ] Define Database Schema:
    - [ ] `User` model (id, email, password, username, avatar).
    - [ ] `Channel` model (id, name, isPrivate).
    - [ ] `Message` model (id, content, senderId, channelId, createdAt).
    - [ ] `Reaction` model (id, emoji, messageId, userId).
- [ ] Run initial migrations to set up the DB.

## Phase 3: Authentication & Identity
- [ ] Implement User Registration/Login API (REST).
- [ ] Set up JWT authentication middleware.
- [ ] Create "Generate Dummy User" script for development.
- [ ] (Frontend) Create Login/Register views.
- [ ] (Frontend) Store JWT in localStorage/Cookies.

## Phase 4: Core API (REST)
- [ ] **Channels API**:
    - [ ] GET `/api/channels` (List all channels).
    - [ ] POST `/api/channels` (Create a channel).
- [ ] **Messages API**:
    - [ ] GET `/api/channels/:id/messages` (Fetch message history for a channel).
    - [ ] POST `/api/messages` (Optional, if not using sockets for sending).
- [ ] **Users API**:
    - [ ] GET `/api/users/me` (Current user profile).
    - [ ] GET `/api/users` (List users for DMs).

## Phase 5: Real-time Integration (Socket.io)
- [ ] Set up Socket.io server logic in `server/`.
- [ ] Implement "Join Room" logic (joining specific channel rooms).
- [ ] Implement "Message Sent" event handling (DB save + broadcast).
- [ ] Implement "Reaction Updated" event handling.
- [ ] (Frontend) Install `socket.io-client`.
- [ ] (Frontend) Create a WebSocket provider/context.

## Phase 6: Frontend Data Integration
- [ ] Install `axios` and `@tanstack/react-query` for data fetching.
- [ ] Replace `initialChannels` static state with API calls.
- [ ] Replace `initialMessages` with real data from the selected channel.
- [ ] Connect `onSendMessage` and `onAddReaction` hooks to Socket.io events.
- [ ] Implement unread counts logic.

## Phase 7: Polish & Advanced Features
- [ ] **File Uploads**: Support for images in chat (requires S3/Uploadthing or similar).
- [ ] **Direct Messages**: Logic for 1-to-1 rooms.
- [ ] **Optimistic Updates**: Use React Query to show messages instantly before DB confirmation.
- [ ] **Persistent Auth**: Refresh token logic or session management.

## Phase 8: Deployment
- [ ] Containerize with Docker (optional).
- [ ] Prepare production build for the client.
- [ ] Set up environment variables for production.
