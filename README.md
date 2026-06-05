# Venotory

A collaborative inventory management platform that allows teams to create, organize, and manage inventories with secure role-based access control. Users can create inventories, invite members through shareable invite codes, and manage items collaboratively.

## Features

- User registration and authentication using JWT
- Secure password hashing with bcrypt
- Create and manage multiple inventories
- Join inventories using invite codes
- Role-based access control
  - Owner
  - Manager
  - Viewer
- Inventory member management
- Item CRUD operations
- Invite code regeneration
- Responsive React frontend
- RESTful Express API
- MongoDB database integration

## Tech Stack

### Frontend

- React
- TypeScript
- Vite
- Axios
- Lucide React

### Backend

- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT Authentication
- bcryptjs

## Architecture

```text
React Client
     │
     │ HTTP / JSON
     ▼
Express API Server
     │
     │ Mongoose
     ▼
MongoDB
```

The frontend communicates with the backend through REST APIs. Authentication is handled using JWT tokens passed through the Authorization header.

## User Roles

| Permission | Owner | Manager | Viewer |
|------------|:-----:|:-------:|:------:|
| View Inventory | ✅ | ✅ | ✅ |
| View Items | ✅ | ✅ | ✅ |
| Add Items | ✅ | ✅ | ❌ |
| Edit Items | ✅ | ✅ | ❌ |
| Delete Items | ✅ | ✅ | ❌ |
| Edit Inventory | ✅ | ✅ | ❌ |
| Manage Members | ✅ | ❌ | ❌ |
| Delete Inventory | ✅ | ❌ | ❌ |
| Regenerate Invite Code | ✅ | ❌ | ❌ |

## Project Structure

```text
Venotory/
│
├── client/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── context/
│   │   ├── types/
│   │   ├── App.tsx
│   │   └── main.tsx
│   │
│   ├── package.json
│   └── vite.config.ts
│
├── server/
│   ├── models/
│   ├── routes/
│   ├── middleware/
│   ├── index.js
│   └── package.json
│
└── DESIGN.md
```

## Installation

### Prerequisites

- Node.js 18+
- MongoDB

### Clone the Repository

```bash
git clone https://github.com/vylarion/ventory.git
cd ventory
```

## Backend Setup

```bash
cd server
npm install
```

Create a `.env` file inside the server directory:

```env
MONGODB_URL=mongodb://localhost:27017/venotory
JWT_SECRET=your-super-secret-key
JWT_EXPIRY_HOURS=24
```

Start the backend server:

```bash
npm run dev
```

Server runs at:

```text
http://localhost:8000
```

## Frontend Setup

```bash
cd client
npm install
npm run dev
```

Frontend runs at:

```text
http://localhost:5173
```

## Authentication

### Register

```http
POST /api/auth/register
```

Request:

```json
{
  "email": "user@example.com",
  "username": "john",
  "password": "password123"
}
```

### Login

```http
POST /api/auth/login
```

Request:

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

Response:

```json
{
  "access_token": "jwt_token"
}
```

### Auth Header

```http
Authorization: Bearer <token>
```

## API Endpoints

### Authentication

| Method | Endpoint | Description |
|----------|----------|-------------|
| POST | `/api/auth/register` | Register a user |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Current user |

### Inventories

| Method | Endpoint |
|----------|----------|
| POST | `/api/inventories` |
| GET | `/api/inventories` |
| GET | `/api/inventories/:id` |
| PUT | `/api/inventories/:id` |
| DELETE | `/api/inventories/:id` |
| POST | `/api/inventories/join` |
| POST | `/api/inventories/:id/regenerate-code` |
| PUT | `/api/inventories/:id/members/:userId` |
| DELETE | `/api/inventories/:id/members/:userId` |

### Items

| Method | Endpoint |
|----------|----------|
| POST | `/api/inventories/:id/items` |
| GET | `/api/inventories/:id/items` |
| PUT | `/api/inventories/:id/items/:itemId` |
| DELETE | `/api/inventories/:id/items/:itemId` |

## Invite Code Workflow

1. User creates an inventory.
2. System generates a unique invite code.
3. Owner shares the code.
4. New users join using the code.
5. Joined users receive the Viewer role by default.
6. Owners can promote users to Manager.

Example:

```json
{
  "invite_code": "a7f2b9c1"
}
```

## Security

- JWT-based authentication
- Password hashing with bcrypt
- Role-based authorization
- Protected API routes
- Invite code validation
- Environment-based secrets

## Future Enhancements

- Search and filtering
- Inventory analytics
- File/image attachments
- Activity logs
- Email invitations
- Inventory export (CSV/PDF)
- Real-time collaboration

## License

This project is licensed under the MIT License.

---

**Venotory** is designed to provide a simple, secure, and collaborative inventory management experience for teams and organizations.
