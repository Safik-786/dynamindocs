# Software Requirements Specification (SRS)
**Project:** Local-First Collaborative Document Editor

## 1. Introduction

### 1.1 Purpose
The purpose of this document is to outline the software requirements for a collaborative, local-first document editing platform. It combines the functionality of Google Docs, Notion, Figma comments, and Linear's offline synchronization capabilities into a unified application.

### 1.2 Scope
The system is a web-based application designed to allow users to create, edit, and collaborate on documents in real-time. The defining characteristic of the system is its **Local-First Architecture**, ensuring that users can seamlessly view and edit documents regardless of their internet connectivity. The system prioritizes local storage as the immediate source of truth, synchronizing with the central server automatically and conflict-free once connectivity is restored.

---

## 2. Overall Description

### 2.1 Core Problem & Solution Approach
**The Problem:** Traditional web applications rely heavily on continuous server communication (User -> Server -> Save). If the internet disconnects, the user loses the ability to edit, or risks losing their data.
**The Solution:** The application adopts a "User -> Browser Storage -> Server Sync" paradigm. Changes are saved locally via IndexedDB instantaneously. When the network is available, a background sync engine processes a queue of operations to the server, ensuring zero data loss, zero loading blockers, and zero merge conflicts.

### 2.2 Recommended Architecture Stack
- **Framework:** Next.js 16 (App Router)
- **UI & Styling:** Tailwind CSS, Shadcn UI
- **Authentication:** Auth.js / NextAuth (JWT)
- **Database:** PostgreSQL (with Prisma ORM)
- **Local Storage:** IndexedDB (via Dexie.js)
- **Real-Time Engine:** Socket.IO / WebSockets
- **Conflict Resolution:** Yjs (CRDT)
- **Validation:** Zod
- **Caching & Rate Limiting:** Redis (Upstash)
- **Hosting:** Vercel

---

## 3. System Features

### 3.1 Authentication
- **Description:** Secure user identification and access management.
- **Requirements:**
  - Users must be able to register, log in, and log out.
  - Authentication should be implemented via Auth.js using JWTs.

### 3.2 Role-Based Access Control (RBAC)
- **Description:** Granular permission system at the document level.
- **Roles:**
  - **Owner:** Full control. Can edit, delete the document, invite other users, and modify permission levels.
  - **Editor:** Can read and modify document content, and create named versions/snapshots.
  - **Viewer:** Read-only access. The UI must completely disable editing and offline syncing of changes for viewers.

### 3.3 Local-First Storage & Offline Editing
- **Description:** The system must function fully while completely disconnected from the internet.
- **Requirements:**
  - Every keystroke and operation must be saved immediately to the browser's IndexedDB (using Dexie.js).
  - The UI must never block or show a "saving..." loading state that prevents the user from typing.
  - Users must be able to transition from offline to online without seeing any errors.

### 3.4 Background Sync Engine
- **Description:** Reconciles offline changes with the server.
- **Requirements:**
  - The system must maintain a local Sync Queue.
  - While offline, operations (e.g., op1, op2, op3) are stored in the queue.
  - Upon network restoration, the system automatically flushes the queue to the server and clears the local queue sequentially.

### 3.5 CRDT Conflict Resolution
- **Description:** Resolving conflicting edits from multiple users (e.g., User A offline vs. User B online) without "last-write-wins" data loss.
- **Requirements:**
  - The system MUST use Conflict-free Replicated Data Types (CRDTs), specifically the **Yjs** library.
  - Conflicting operations (e.g., "Hello World" vs. "Hello GPT") must logically merge (e.g., "Hello World GPT") to preserve the intent of both users.

### 3.6 Real-Time Collaboration
- **Description:** Live document editing.
- **Requirements:**
  - When online, changes made by one user must reflect instantly on the screens of all other active users viewing the document.
  - Powered by WebSockets or Socket.IO.

### 3.7 Version History & Time Travel
- **Description:** Tracking historical milestones of the document.
- **Requirements:**
  - Editors can create named snapshots of the document state (e.g., "Version 1", "Added paragraph").
  - A timeline UI should display chronological versions.
  - **Time Travel:** Restoring a past version must *not* irreversibly overwrite history or break current collaborators. It should act like a Git revert, creating a *new* operation that resets the state, appending to the history timeline.

### 3.8 AI Integrations (Bonus Features)
- **Description:** AI-assisted document workflows.
- **Requirements:**
  - **Summarization:** Generate a summary of the entire document.
  - **Rewrite:** Refine selected text to sound more professional.
  - **Action Items:** Automatically extract tasks/to-dos from meeting notes.
  - **Chat with Document:** A conversational UI to ask questions about the uploaded/written document content (Powered by OpenAI, Gemini, or Groq).

---

## 4. Security & Non-Functional Requirements

### 4.1 Data Validation
- **Description:** Preventing malformed data from corrupting the database or CRDT state.
- **Requirements:**
  - All incoming payloads must be strictly validated using **Zod**.
  - Specifically validate the shape: `{ documentId: "...", operations: [...] }`.

### 4.2 Security & Rate Limiting
- **Description:** Protection against malicious behavior, specifically OOM (Out of Memory) attacks.
- **Requirements:**
  - **Payload Limits:** The server must reject any request payload exceeding 10 MB.
  - **Rate Limiting:** Implement strict IP-based rate limiting using Redis to prevent infinite loop/DDoS attacks.
  - **Request Timeouts:** Terminate long-hanging requests to preserve server connection pools.

---

## 5. Database Schema Requirements (PostgreSQL)
The application requires the following core tables to support the outlined features:
- `users`: Core authentication and profile data.
- `documents`: Document metadata and current compacted CRDT binary state.
- `document_members`: Maps users to documents with specific access roles.
- `document_versions`: Stores named, point-in-time binary snapshots.
- `sync_operations`: An append-only log of granular CRDT operations for conflict resolution and timeline rebuilding.
