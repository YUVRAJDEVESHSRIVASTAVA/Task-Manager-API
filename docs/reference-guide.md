# Task Manager API Reference Guide

This document is meant to be a study reference for the project. It explains what the app does, how the pieces connect, and which files matter most when you are learning or reviewing the code.

For a file-by-file React and TypeScript walkthrough with simple explanations and examples, see [docs/react-typescript-walkthrough.md](docs/react-typescript-walkthrough.md).

## 1. Project in One Sentence

This is a full-stack task manager where users can register, log in, create and manage tasks with deadlines, and where admins can review user activity such as signups, logins, logouts, and task changes.

## 2. What the App Does

- Creates user accounts with registration and login.
- Stores passwords safely by hashing them before saving.
- Keeps users signed in with secure session cookies.
- Lets users create, edit, complete, and delete tasks.
- Tracks task status, priority, and deadline.
- Marks overdue and due-today work clearly.
- Records audit events so admins can see what happened.
- Shows an admin dashboard with users, sessions, and activity history.

## 3. Big Picture Flow

The app works in five layers:

1. The user interacts with a page such as `/auth`, `/dashboard`, or `/admin`.
2. The page sends a request to an API route.
3. The API route validates input and calls a server-side service.
4. The service reads or writes data through Prisma and SQLite.
5. The response is returned to the UI and the page updates.

That means the UI stays simple, while the real business rules live on the server.

## 4. Main Pages

- `/` is the public landing page.
- `/auth` is for login and registration.
- `/dashboard` is the main task workspace for signed-in users.
- `/admin` is the admin visibility page.

## 5. Main API Routes

### Auth

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`

### Tasks

- `GET /api/tasks`
- `POST /api/tasks`
- `PATCH /api/tasks/[taskId]`
- `DELETE /api/tasks/[taskId]`

### Admin

- `GET /api/admin/overview`

## 6. Data Model

The database is designed around four main records.

### User

Stores account details such as name, email, password hash, role, and login metadata.

### Session

Stores active and revoked session data, including the token hash, expiry, IP address, and user agent.

### Task

Stores task title, description, status, priority, deadline, and completion time.

### AuditLog

Stores activity records so the admin can review important events later.

Examples include:

- user registration
- login
- logout
- task creation
- task updates
- task deletion

## 7. How Registration and Login Work

When a user registers:

1. The request body is validated.
2. The password is hashed.
3. A new user row is written to the database.
4. A session is created.
5. A secure HTTP-only cookie is sent back.
6. An audit log entry is stored.

When a user logs in:

1. The email and password are checked.
2. The stored password hash is verified.
3. A new session is created.
4. The browser receives a session cookie.
5. A login audit event is saved.

When a user logs out:

1. The session is revoked.
2. The cookie is cleared.
3. A logout audit event is saved.

## 8. How Task Management Works

Task actions are handled on the server, not only in the UI.

- Create task: saves a new task for the signed-in user.
- Update task: changes title, description, status, priority, or deadline.
- Complete task: marks the task done and records completion time.
- Delete task: removes the task.

Each important task action can also be written to the audit log.

## 9. Admin Visibility

The admin page is built so a reviewer can understand app activity quickly.

It shows:

- total users
- active sessions
- login and logout history
- task counts
- overdue tasks
- recent audit events

This is the main feature that makes the system observable.

## 10. Important Files to Study First

- [src/lib/prisma.ts](../src/lib/prisma.ts) - Prisma client setup.
- [prisma.config.ts](../prisma.config.ts) - Prisma 7 config.
- [prisma/schema.prisma](../prisma/schema.prisma) - database tables and enums.
- [src/lib/session.ts](../src/lib/session.ts) - session token and cookie logic.
- [src/lib/auth-service.ts](../src/lib/auth-service.ts) - registration, login, logout.
- [src/lib/task-service.ts](../src/lib/task-service.ts) - task CRUD and dashboard data.
- [src/lib/admin-service.ts](../src/lib/admin-service.ts) - admin summary data.
- [src/app/api/auth/register/route.ts](../src/app/api/auth/register/route.ts) - register endpoint.
- [src/app/api/auth/login/route.ts](../src/app/api/auth/login/route.ts) - login endpoint.
- [src/app/api/tasks/route.ts](../src/app/api/tasks/route.ts) - task collection endpoint.
- [src/components/dashboard-client.tsx](../src/components/dashboard-client.tsx) - dashboard UI.
- [src/components/admin-client.tsx](../src/components/admin-client.tsx) - admin UI.

## 11. Why This Stack Was Chosen

- Next.js keeps the UI and API in one project.
- Prisma gives a clean database layer and typed queries.
- SQLite makes local setup simple.
- Cookie-based sessions are a practical way to keep users signed in.
- Tailwind keeps the UI responsive without a heavy styling system.

## 12. Security Notes

- Passwords are never stored in plain text.
- Session tokens are hashed before storage.
- Session cookies are HTTP-only.
- Admin access is role-based.
- Input is validated before database writes happen.

## 13. Local Development Commands

```bash
npm install
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev
```

Useful checks:

```bash
npm run lint
npm run build
```

## 14. Default Admin Account

For local development, the project uses this default admin account:

- Email: `admin@taskmanager.local`
- Password: `Admin123!`

Change this before using the app outside your local machine.

## 15. How to Explain the Project to Someone Else

You can describe it like this:

> This is a task manager web app with login, task tracking, and an admin panel. Users can manage their own tasks, while the admin can see account activity and task history. The app stores everything in a SQLite database through Prisma and uses secure cookie sessions for authentication.

## 16. Good Study Order

If you want to learn the project step by step, read it in this order:

1. `prisma/schema.prisma`
2. `src/lib/session.ts`
3. `src/lib/auth-service.ts`
4. `src/lib/task-service.ts`
5. `src/lib/admin-service.ts`
6. `src/app/api/*/route.ts`
7. `src/components/*`

## 17. Short Summary

The project is built around a simple idea: users log in, manage tasks, and the system records important events so admins can review what happened. The backend owns the rules, the database stores the truth, and the UI just presents the data clearly.