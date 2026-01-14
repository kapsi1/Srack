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
- [x] Prepare production build for the client.
- [x] Set up environment variables for production.

## Phase 9: Feature Implementation (Unused UI Items)
*Sorted by implementation difficulty (Easiest to Hardest)*

### Easiest (Frontend & Simple DB State)
- [x] **Emoji Picker integration**: Replace basic reaction list with a full emoji picker (e.g., `emoji-picker-react`) in both Message Input and Message Popup.
- [ ] **Channel Info / View Members**: Implement the "i" and "Users" icons in the top bar to show channel details and member lists.
- [ ] **Save Message / Saved Items**: Implement the "Bookmark" functionality. Add a "Saved Items" view in the sidebar to retrieve bookmarked messages.
- [ ] **Channel Search**: basic search functionality using the "Search" icon in the top bar to filter messages in the current channel.

### Medium (Requires Schema Changes or Complex UI)
- [ ] **Threads (Replies)**: Implement "Reply in Thread" from the message popup. Requires `parentMessageId` in DB and a side-panel UI for thread conversations.
- [ ] **Mentions & Reactions View**: Implement the sidebar link to show a consolidated feed of all mentions and reactions received by the user.
- [ ] **User Mentions (@)**: Implement the "@" button/trigger logic to show a user dropdown and handle mention notifications.
- [ ] **Forward Message**: Implement the "Share" icon in the message popup to copy a message to another channel.

### Hard (Requires Media Handling / External Services)
- [ ] **File Attachments**: Implement the "Paperclip" icon functionality using a storage service (S3/Uploadthing) to support image and file sharing.
- [ ] **Voice Recording**: Implement the "Microphone" icon to record and send voice messages.
- [ ] **Voice/Video Calls**: Implement the "Phone" and "Video" icons in the top bar using WebRTC or a service like LiveKit/Agora.
