# Venotory — Software Design Document

A collaborative inventory management application where users can create, share, and manage inventories with role-based access control.

---

## 1. Tech Stack

| Layer         | Technology             | Purpose                                    |
|---------------|------------------------|--------------------------------------------|
| Frontend      | React + TypeScript     | Component-based UI with type safety        |
| Build Tool    | Vite                   | Fast dev server & bundler for React        |
| HTTP Client   | Axios                  | API calls from frontend to backend         |
| Icons         | Lucide React           | Simple SVG icon library                    |
| Backend       | Node.js + Express      | REST API server                            |
| Database      | MongoDB                | NoSQL document store                       |
| ODM           | Mongoose               | MongoDB object-document mapper             |
| Auth          | JWT (jsonwebtoken)     | Stateless token-based authentication       |
| Passwords     | bcryptjs               | Secure password hashing                    |
| Config        | dotenv                 | Environment variable management            |

---

## 2. Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                     CLIENT (React)                  │
│  ┌──────────┐  ┌──────────┐  ┌───────────────────┐  │
│  │ Auth     │  │ Dashboard│  │ Inventory View    │  │
│  │ Pages    │  │ Page     │  │ (Items + Members) │  │
│  └──────────┘  └──────────┘  └───────────────────┘  │
│                      │ HTTP (JSON)                   │
└──────────────────────┼───────────────────────────────┘
                       │  Vite proxy: /api → :8000
┌──────────────────────┼───────────────────────────────┐
│                  SERVER (Express.js)                  │
│                      │                               │
│  ┌──────────────────────────────────────────────┐    │
│  │              Route Layer                      │    │
│  │  /api/auth    /api/inventories    /items      │    │
│  └──────────────────┬───────────────────────────┘    │
│                     │                                │
│  ┌──────────────────┼───────────────────────────┐    │
│  │              Middleware                       │    │
│  │  JWT Auth (verify token, set req.userId)     │    │
│  └──────────────────┬───────────────────────────┘    │
│                     │                                │
│  ┌──────────────────┼───────────────────────────┐    │
│  │            Data Layer (Mongoose)              │    │
│  │  User Model  │  Inventory Model  │ Item Model │    │
│  └──────────────────┬───────────────────────────┘    │
│                     │                                │
└──────────────────────┼───────────────────────────────┘
                       │
               ┌───────┴────────┐
               │    MongoDB     │
               └────────────────┘
```

### Request Flow
1. Client sends HTTP request with JWT token in `Authorization` header
2. Express auth middleware validates the JWT and puts user ID on `req.userId`
3. Route handler checks if user has the required role for the operation
4. Mongoose executes the database operation
5. Response is returned as JSON

---

## 3. Project Structure

```
Venotory/
├── client/                     # React Frontend
│   ├── src/
│   │   ├── components/         # Reusable UI components
│   │   │   ├── Navbar.tsx
│   │   │   └── ProtectedRoute.tsx
│   │   ├── pages/              # Page-level components
│   │   │   ├── landing/index.tsx
│   │   │   ├── login/index.tsx
│   │   │   ├── register/index.tsx
│   │   │   ├── dashboard/index.tsx
│   │   │   └── inventory/index.tsx
│   │   ├── services/           # API call functions
│   │   │   └── api.ts
│   │   ├── context/            # React context (auth state)
│   │   │   └── AuthContext.tsx
│   │   ├── types/              # TypeScript type definitions
│   │   │   └── index.ts
│   │   ├── index.css           # Global styles
│   │   ├── App.tsx             # Router + layout
│   │   └── main.tsx            # Entry point
│   ├── index.html
│   ├── package.json
│   └── vite.config.ts          # Dev proxy to backend
│
├── server/                     # Express Backend
│   ├── models/                 # Mongoose schemas
│   │   ├── User.js
│   │   ├── Inventory.js
│   │   └── Item.js
│   ├── routes/                 # API route handlers
│   │   ├── auth.js
│   │   ├── inventory.js
│   │   └── items.js
│   ├── middleware/
│   │   └── auth.js             # JWT verification
│   ├── index.js                # App entry point
│   ├── .env                    # Secrets (NEVER commit this)
│   └── package.json
│
├── DESIGN.md                   # This document
└── .gitignore
```

> **Why no separate "schemas" folder on the backend?**
> In Express + Mongoose, the model file defines both the database schema
> and serves as the data layer. We shape the API response directly in
> the route handlers using plain objects — no separate schema layer needed.
> This keeps things simpler.

---

## 4. Data Models

### 4.1 User
```
Collection: "users"
┌──────────────────┬───────────┬──────────────────────────────┐
│ Field            │ Type      │ Notes                        │
├──────────────────┼───────────┼──────────────────────────────┤
│ _id              │ ObjectId  │ Auto-generated by MongoDB    │
│ email            │ string    │ Unique, stored lowercase     │
│ username         │ string    │ Display name                 │
│ password         │ string    │ bcrypt hash, never exposed   │
│ createdAt        │ Date      │ Auto (timestamps: true)      │
│ updatedAt        │ Date      │ Auto (timestamps: true)      │
└──────────────────┴───────────┴──────────────────────────────┘
```

### 4.2 Inventory
```
Collection: "inventories"
┌──────────────────┬────────────────┬──────────────────────────┐
│ Field            │ Type           │ Notes                    │
├──────────────────┼────────────────┼──────────────────────────┤
│ _id              │ ObjectId       │ Auto-generated           │
│ name             │ string         │ Inventory title          │
│ description      │ string         │ Defaults to ""           │
│ owner            │ ObjectId       │ References User._id      │
│ inviteCode       │ string         │ Unique, random 8-hex     │
│ members          │ Member[]       │ Embedded sub-documents   │
│ createdAt        │ Date           │ Auto                     │
│ updatedAt        │ Date           │ Auto                     │
└──────────────────┴────────────────┴──────────────────────────┘

Embedded Sub-document: Member
┌──────────────────┬───────────┬──────────────────────────────┐
│ Field            │ Type      │ Notes                        │
├──────────────────┼───────────┼──────────────────────────────┤
│ user             │ ObjectId  │ References User._id          │
│ role             │ string    │ "manager" | "viewer"         │
└──────────────────┴───────────┴──────────────────────────────┘
```

### 4.3 Item
```
Collection: "items"
┌──────────────────┬───────────────┬───────────────────────────┐
│ Field            │ Type          │ Notes                     │
├──────────────────┼───────────────┼───────────────────────────┤
│ _id              │ ObjectId      │ Auto-generated            │
│ name             │ string        │ Item name                 │
│ quantity         │ number        │ Defaults to 0             │
│ description      │ string        │ Defaults to ""            │
│ inventory        │ ObjectId      │ References Inventory._id  │
│ addedBy          │ ObjectId      │ References User._id       │
│ createdAt        │ Date          │ Auto                      │
│ updatedAt        │ Date          │ Auto                      │
└──────────────────┴───────────────┴───────────────────────────┘
```

---

## 5. Invite Code System

Users join inventories using a **randomly generated invite code** rather than through direct user search. This keeps things simple, private, and spam-free.

### How It Works
1. When a user **creates an inventory**, the server generates a unique 8-character hex invite code (e.g., `a7f2b9c1`)
2. The owner **shares this code** with people they want to invite (via chat, email, etc.)
3. A user enters the code on the **"Join Inventory"** dialog
4. The server validates the code, checks the user isn't already a member, and adds them as a **viewer** by default
5. The owner can later **promote** them to manager

### Key Decisions
- **Default role on join:** `viewer` (safe default — owner explicitly grants edit access)
- **Code regeneration:** The owner can regenerate the invite code at any time (invalidates the old one)
- **No expiry:** Codes don't expire, but regeneration effectively revokes the old code

### Join Flow
```
User enters code ──► POST /api/inventories/join { "invite_code": "a7f2b9c1" }
                              │
                              ▼
                     Find inventory by code
                              │
                     ┌────────┴─────────┐
                     │ Already member?  │
                     └────────┬─────────┘
                        No ──►│◄── Yes ──► 400 Error
                              │
                     Add user as "viewer"
                              │
                     Return inventory data
```

---

## 6. API Endpoints

All routes are prefixed with `/api`.

### 6.1 Auth (`/api/auth`)
| Method | Endpoint         | Description           | Auth Required |
|--------|------------------|-----------------------|---------------|
| POST   | `/auth/register` | Create a new account  | No            |
| POST   | `/auth/login`    | Get a JWT token       | No            |
| GET    | `/auth/me`       | Get current user info | Yes           |

### 6.2 Inventories (`/api/inventories`)
| Method | Endpoint                             | Description              | Auth / Role     |
|--------|--------------------------------------|--------------------------|-----------------|
| POST   | `/inventories`                       | Create new inventory     | Authenticated   |
| GET    | `/inventories`                       | List user's inventories  | Authenticated   |
| GET    | `/inventories/:id`                   | Get inventory details    | Member          |
| PUT    | `/inventories/:id`                   | Update inventory info    | Owner / Manager |
| DELETE | `/inventories/:id`                   | Delete inventory         | Owner           |
| POST   | `/inventories/join`                  | Join via invite code     | Authenticated   |
| POST   | `/inventories/:id/regenerate-code`   | Generate new invite code | Owner           |
| PUT    | `/inventories/:id/members/:userId`   | Change member's role     | Owner           |
| DELETE | `/inventories/:id/members/:userId`   | Remove a member          | Owner           |

### 6.3 Items (`/api/inventories/:id/items`)
| Method | Endpoint                                  | Description       | Auth / Role     |
|--------|-------------------------------------------|-------------------|-----------------|
| POST   | `/inventories/:id/items`                  | Add an item       | Owner / Manager |
| GET    | `/inventories/:id/items`                  | List all items    | Member          |
| PUT    | `/inventories/:id/items/:itemId`          | Update an item    | Owner / Manager |
| DELETE | `/inventories/:id/items/:itemId`          | Delete an item    | Owner / Manager |

---

## 7. Authentication Flow

```
                  REGISTER                              LOGIN
                     │                                    │
    POST /api/auth/register                  POST /api/auth/login
    { email, username, password }           { email, password }
                     │                                    │
              bcrypt.hash(pw, 10)               bcrypt.compare(pw, hash)
              Save to MongoDB                             │
                     │                           ┌────────┴─────────┐
              Return user info                   │  Match?          │
                                                 └────────┬─────────┘
                                            Yes ──►       │  ◄── No ──► 401
                                                          │
                                           jwt.sign({ sub: userId })
                                                          │
                                           Return { access_token }
```

### JWT Token Structure
```json
{
  "sub": "user_id_here",
  "exp": 1700000000
}
```
- Sent in every request as: `Authorization: Bearer <token>`
- Expires after a configurable duration (default: 24 hours)
- Frontend stores it in `localStorage`

---

## 8. Role-Based Access Control

| Action                  | Owner | Manager | Viewer |
|-------------------------|:-----:|:-------:|:------:|
| View inventory          | ✅    | ✅      | ✅     |
| View items              | ✅    | ✅      | ✅     |
| Add / Edit / Delete items| ✅   | ✅      | ❌     |
| Edit inventory details  | ✅    | ✅      | ❌     |
| Manage members          | ✅    | ❌      | ❌     |
| Delete inventory        | ✅    | ❌      | ❌     |
| Regenerate invite code  | ✅    | ❌      | ❌     |

---

## 9. Environment Variables

```env
# server/.env

MONGODB_URL=mongodb://localhost:27017/venotory
JWT_SECRET=your-super-secret-key-change-this
JWT_EXPIRY_HOURS=24
```

---

## 10. How to Run

### Backend
```bash
cd server
npm install
npm run dev          # uses node --watch for auto-reload
```
Server starts on `http://localhost:8000`

### Frontend
```bash
cd client
npm install
npm run dev          # Vite dev server with /api proxy
```
App runs on `http://localhost:5173`

### Prerequisites
- Node.js 18+
- MongoDB running locally (or a MongoDB Atlas connection string in `.env`)

---

## 11. Build Order

| Phase | What                                      | Status  |
|-------|-------------------------------------------|---------|
| 1     | Project setup (client + server)           | ✅ Done |
| 2     | Mongoose models (User, Inventory, Item)   | ✅ Done |
| 3     | Auth middleware (JWT verification)        | ✅ Done |
| 4     | Auth routes (register, login, me)         | ✅ Done |
| 5     | Inventory routes + invite code system     | ✅ Done |
| 6     | Item routes + role-based permissions      | ✅ Done |
| 7     | Frontend: Types, API service, Auth context| ✅ Done |
| 8     | Frontend: Auth pages (Login, Register)    | ✅ Done |
| 9     | Frontend: Dashboard + create/join modals  | ✅ Done |
| 10    | Frontend: Inventory view + item management| ✅ Done |
| 11    | Comments + documentation                  | ✅ Done |
