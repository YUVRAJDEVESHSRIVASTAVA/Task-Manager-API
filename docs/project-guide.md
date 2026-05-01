# Task Manager API Guide

## Project overview

This application is a task management platform with a web UI and API endpoints. Users can create accounts, sign in, manage tasks, and track deadlines. The admin can see who registered, who logged in, who logged out, and the current activity state of the app.

## Why this stack was chosen

- Next.js gives a single codebase for the web UI and API routes.
- Prisma provides a clean database layer and schema migrations.
- SQLite keeps local setup simple while still behaving like a real database.
- Cookie-based sessions make login state easy to manage securely.
- Tailwind CSS keeps the UI responsive and easy to extend.

## How the app works

### 1. Registration and login

When a user registers or logs in, the API:

1. Validates the request body.
2. Hashes or verifies the password.
3. Creates a session record in the database.
4. Stores a secure HTTP-only session cookie in the browser.
5. Writes an audit log entry so the admin can see the event later.

### 2. Task management

Authenticated users can:

- Create tasks
- Update titles, descriptions, statuses, priorities, and deadlines
- Mark tasks done or move them back to other states
- Delete tasks

Every task change also writes an audit log entry.

### 3. Admin visibility

The admin dashboard reads from the same database and shows:

- Registered users
- Current active sessions
- Login and logout history
- Task-related audit events
- Summary statistics such as total users and overdue tasks

## Database model

### User

Stores account details, role, and login/logout timestamps.

### Session

Stores the session token hash, expiry, IP address, user agent, and whether the session was revoked.

### Task

Stores title, description, status, priority, deadline, and completion timestamp.

### AuditLog

Stores human-readable activity events so the admin can understand what happened and when.

## API endpoints

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

## Frontend pages

- `/` shows the public landing page.
- `/auth` contains login and registration forms.
- `/dashboard` is the task workspace.
- `/admin` is the audit and visibility screen for admins.

## Local setup

1. Install dependencies.
2. Generate the Prisma client.
3. Run the database migration.
4. Seed the admin account.
5. Start the app.

Example:

```bash
npm install
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev
```

## How to explain this project to someone else

You can describe it like this:

> This is a full-stack task manager where each user can sign up, log in, and manage their own tasks. The system stores sessions, task updates, and login/logout activity in a database, and the admin dashboard gives visibility into user actions and app activity.

## Important implementation details

- Passwords are never stored in plain text.
- Session tokens are hashed before they are saved in the database.
- Admin access is role-based.
- The UI is server-rendered where it helps with security and first load, and client-side where it helps with interactivity.

## Suggested next improvements

- Add pagination to the task list for larger accounts.
- Add task comments or attachments.
- Add email notifications for overdue tasks.
- Add editing history for tasks.
- Add export buttons for admin reports.