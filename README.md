# 📄 Collaborative File Editor

Collaborative file editor** using **Laravel**, **React**, **Redis Pub/Sub**, and **AWS S3**. 
It supports **undo/redo**, **concurrent editing**, and **conflict-free document updates** via CRDT.

## 🔧 Key Technologies

- **Backend**: Laravel
- **Frontend**: React
- **Real-time Sync**: Redis Pub/Sub + Laravel Broadcasting
- **Persistence**: AWS S3 (Tree-structured documents)
- **CRDT Model**: Replicated Growable Array (RGA)

## 🔁 Core Logic Overview

This editor ensures **real-time synchronization and consistency** between multiple users by using an **event-driven architecture** and **CRDT-based logic**.

### 🧩 How it Works

```mermaid
sequenceDiagram
    participant User A
    participant Laravel App
    participant Redis
    participant User B
    participant React UI

    User A->>Laravel App: Opens Document
    Laravel App->>User A: Loads Document from S3

    User A->>Laravel App: Makes Edit (Insert/Delete)
    Laravel App->>Redis: Publishes Edit Event
    Redis-->>Laravel App: Receives Event
    Laravel App-->>User B: Broadcasts Change
    User B->>React UI: Applies Change (CRDT RGA)
    React UI-->>User B: Renders Updated Document
```

## 📘 CRDT: The Heart of Collaboration

**Replicated Growable Array (RGA)** to manage concurrent operations on the document.

- Every change (insertion/deletion) is treated as an **event**.
- These events are **ordered and replicated** across clients.
- All operations are **commutative, associative, and idempotent**, and eventually consistent.

## 🔄 Broadcasting & Synchronization

1. **User opens a document** — Laravel loads it from S3.
2. **User makes a change** — Laravel processes and broadcasts an event describing the operation.
3. **Redis Pub/Sub** — used as a low-latency message bus.
4. **Other connected users** receive the event and apply it via React UI using CRDT logic.

## 📂 Document Structure

Documents are stored as a **tree**, with:

- **Leaf nodes**: raw text chunks
- **Internal nodes**: links to children (like a filesystem)

This allows **efficient partial updates** and **easy navigation** across large documents.

## ✅ Features

- Real-time collaborative editing
- Conflict-free changes via CRDT (RGA)
- Undo/redo support + changelog history
- Efficient tree-based document structure
- Persistent storage in AWS S3
- Redis-based Pub/Sub broadcasting

## 🚀 Running the Project

```bash
# Install backend dependencies
composer install

# Install frontend dependencies
npm install && npm run dev

# Start Laravel server
php artisan serve

# Start Redis
redis-server

# Queue worker for broadcasting events
php artisan queue:work
```


