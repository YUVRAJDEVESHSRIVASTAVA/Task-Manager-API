# React and TypeScript Walkthrough

This guide explains the app's React and TypeScript files in simple language. It is written for learning, so each file explains what it does, why it exists, and the key ideas it teaches.

## How to Read This Guide

- Files under `src/app` are mostly page and route files.
- Files under `src/components` are React components.
- Files under `src/lib` are shared TypeScript helpers, service logic, and data tools.
- Files like `next.config.ts`, `prisma.config.ts`, and `prisma/seed.ts` are setup files.

A good learning order is:
1. `src/lib/constants.ts`
2. `src/lib/types.ts`
3. `src/lib/validators.ts`
4. `src/lib/serializers.ts`
5. `src/lib/session.ts`
6. `src/lib/auth-service.ts`
7. `src/lib/task-service.ts`
8. `src/components/auth-panel.tsx`
9. `src/components/dashboard-client.tsx`
10. `src/components/admin-client.tsx`

## React and TypeScript Ideas Used in This Project

Before we go file by file, here are the main ideas the code uses:

- `useState` stores changing values in the browser.
- `useEffect` runs code after the component shows up.
- `useDeferredValue` delays expensive filtering so typing stays smooth.
- `useTransition` lets the UI stay responsive while state refreshes.
- `type` and `interface` describe data shapes.
- Union types like `"login" | "register"` only allow a few values.
- `as const` turns arrays into readonly values that can also become types.
- `Partial<T>` makes every field optional.
- `Record<K, V>` means an object whose keys and values follow a known pattern.
- `Pick<T, K>` chooses only a few fields from a bigger type.
- `async/await` makes server calls easier to read.
- `fetch()` is used to talk to the API routes.

## Setup Files

### `next.config.ts`

This is the Next.js config file.

- It imports `NextConfig`, which gives the file TypeScript safety.
- `nextConfig` is currently empty because the project works with the default Next.js settings.
- `export default nextConfig` makes Next.js read this config.

Example: if you later want to allow remote images, this is the file where you would add that rule.

### `prisma.config.ts`

This file tells Prisma where the schema lives and where the SQLite database is stored.

- `schema: "prisma/schema.prisma"` points Prisma to the database model file.
- `migrations.path` tells Prisma where to save migration files.
- `datasource.url` points to `file:./prisma/dev.db`, which means local SQLite.

Example: if you move to PostgreSQL later, this file is one of the places you would update.

### `prisma/seed.ts`

This file creates the default admin account for local development.

- It reads the admin email, password, and name from environment variables.
- It checks whether the admin already exists.
- If the account exists but is not an admin, it upgrades the role.
- If the account does not exist, it creates it and writes an audit log.
- The `finally` block disconnects Prisma cleanly.

Example: running the seed file once is like saying, "set up my starting admin account for me."

## Shared Constants and Types

### `src/lib/constants.ts`

This file stores values that many files share.

- `userRoles`, `taskStatuses`, `taskPriorities`, and `auditActions` are arrays with `as const`.
- The `type` aliases below those arrays turn them into TypeScript union types.
- `SESSION_COOKIE_NAME` is the cookie name used for login sessions.
- `SESSION_DURATION_DAYS` controls how long a session lasts.
- `roleMeta`, `taskStatusMeta`, `taskPriorityMeta`, and `auditActionMeta` map values to labels and CSS classes.

Example:
- `roleMeta.ADMIN.label` becomes `Admin`.
- `taskStatusMeta.DONE.label` becomes `Done`.

This file is a good TypeScript lesson because it shows how values can become types.

### `src/lib/types.ts`

This file describes the shapes of data that travel between the server and the browser.

- `SerializedUser` is the safe version of a user object.
- `SerializedTask` is the browser-friendly task shape.
- `SerializedSession` includes the user and session details.
- `SerializedAuditLog` holds activity records for the admin view.
- `DashboardSummary` stores counts like overdue tasks and tasks done.
- `DashboardSnapshot` bundles the current user, tasks, and summary.
- `AdminOverview` bundles users, sessions, activity, and top-level counts.

Example: instead of sending a Prisma `Date` object directly, the app sends strings like `"2026-05-01T04:17:37.000Z"`.

These types help React components know exactly what they will receive.

## Shared Helpers

### `src/lib/errors.ts`

This file defines custom app errors.

- `AppError` extends the normal JavaScript `Error` class.
- It also stores an HTTP status code.
- `badRequest`, `unauthorized`, `forbidden`, `notFound`, and `conflict` are shortcut helpers.

Example:
- `notFound("Task not found.")` means HTTP 404.
- `conflict("An account with that email already exists.")` means HTTP 409.

This is a clean way to keep error handling consistent.

### `src/lib/api.ts`

This file turns errors into JSON API responses.

- `routeErrorResponse()` checks whether the error is an `AppError`.
- If it is, the function uses the status and message from that error.
- If it is not, the function uses the fallback message and returns 500.

Example: if task creation fails because of a bad deadline, the route can return a 400 response without repeating the same code everywhere.

### `src/lib/dates.ts`

This file handles date formatting and date checks.

- `formatDateTime()` shows a full date and time.
- `formatDateOnly()` shows only the date.
- `toDateTimeLocalValue()` converts ISO strings into the format required by `<input type="datetime-local">`.
- `parseIsoDate()` safely converts a string into a `Date` or returns `null`.
- `isOverdue()` checks whether a task deadline has passed and the task is not done.
- `isDueToday()` checks whether the task deadline is today.

Example:
- If a task deadline is yesterday and the task is not `DONE`, `isOverdue()` returns `true`.
- If a task is due later today, `isDueToday()` returns `true`.

### `src/lib/password.ts`

This file deals with password hashing.

- `hashPassword()` uses `bcrypt.hash(password, 12)`.
- `verifyPassword()` checks whether a plain password matches the saved hash.

Example:
- The string `Password123!` is never stored directly.
- The database stores only a hashed version, which is much safer.

This teaches an important security rule: never store plain passwords.

### `src/lib/prisma.ts`

This file creates the shared Prisma client.

- It imports `PrismaClient` and the SQLite adapter.
- It uses `process.env.DATABASE_URL ?? "file:./prisma/dev.db"` as a fallback.
- It caches the Prisma client on `globalThis` during development.

Why cache it?
- Next.js can reload modules many times in development.
- Without caching, you might create too many database clients.

Example: think of this file as the single door to the database.

### `src/lib/serializers.ts`

This file converts Prisma objects into plain JSON objects for the browser.

- `serializeUser()` turns `Date` values into ISO strings.
- `serializeTask()` does the same for tasks.
- `serializeSession()` includes the nested user too.
- `serializeAuditLog()` keeps only the fields the UI needs.

Why this matters:
- React components do not want raw Prisma objects with `Date` instances.
- JSON works better when everything is plain data.

Example: `new Date()` becomes a string like `"2026-05-01T04:17:37.000Z"`.

### `src/lib/validators.ts`

This file uses Zod to validate incoming data.

- `registerSchema` checks name, email, and password.
- `loginSchema` checks email and password.
- `taskSchema` checks title, description, status, priority, and deadline.
- `taskPatchSchema` makes the task fields optional for partial updates.

Useful TypeScript ideas here:
- `z.enum(taskStatuses)` only allows known task status values.
- `.partial()` means PATCH requests can send only the field that changed.

Example:
- `"A"` fails the name rule because the name must be at least 2 characters.
- `"not-an-email"` fails the email rule.

### `src/lib/audit.ts`

This file writes audit events to the database.

- `recordAuditLog()` takes an action, message, and optional user/session metadata.
- It writes the row into the `AuditLog` table.

Example:
- When a user registers, the app saves a `USER_REGISTERED` audit record.
- When a task is deleted, the app saves a `TASK_DELETED` record.

### `src/lib/session.ts`

This file handles login sessions and cookies.

- `hashSessionToken()` turns a random token into a SHA-256 hash.
- `createSessionToken()` makes a secure random token.
- `getRequestMetadata()` extracts IP address and user agent from headers.
- `createSession()` saves a session record in the database.
- `resolveSessionFromToken()` checks whether a session exists, is valid, and is not expired.
- `getCurrentAuthContext()` reads the session cookie from the current request.
- `setSessionCookie()` writes the cookie back to the browser.
- `clearSessionCookie()` removes the cookie.

This file is a great example of secure auth design:
- The browser stores the token.
- The database stores only the hashed token.
- The server checks the hash when the user comes back.

Example:
- If the cookie contains `abc123`, the server hashes it first and then looks for that hash in the database.

## Business Logic Services

### `src/lib/auth-service.ts`

This file contains the real login, register, and logout logic.

Helper functions:
- `normalizeEmail()` trims spaces and makes the email lowercase.
- `normalizeName()` trims the name and collapses repeated spaces.
- `normalizeUserName()` returns a safe display name.

Main functions:
- `registerAccount()` checks whether the email already exists, hashes the password, creates the user, creates a session, updates `lastLoginAt`, and writes two audit logs.
- `loginAccount()` finds the user, checks the password, creates a session, updates `lastLoginAt`, and writes a login audit log.
- `logoutAccount()` revokes the session, updates `lastLogoutAt`, and writes a logout audit log.

Example: registration is not just "create user". It also logs the person in right away and records that event.

### `src/lib/task-service.ts`

This file contains the task logic and dashboard summary logic.

Helper functions:
- `normalizeText()` trims text and turns empty strings into `null`.
- `getTaskOrThrow()` makes sure the task belongs to the current user.
- `summarizeTasks()` counts task statuses, overdue tasks, and tasks due today.

Main functions:
- `getDashboardSnapshot()` loads the current user, their tasks, and recent activity.
- `createTask()` validates the deadline, creates the task, and records an audit log.
- `updateTask()` updates the task and keeps the completion timestamp logic correct.
- `deleteTask()` removes the task and records an audit log.

Example:
- If a task changes to `DONE`, `completedAt` gets set.
- If a completed task changes back to another status, `completedAt` becomes `null`.

### `src/lib/admin-service.ts`

This file builds the data shown on the admin page.

- It loads users, active sessions, audit logs, and summary counts in parallel with `Promise.all()`.
- It counts how many sessions each user has.
- It returns a single `AdminOverview` object for the UI.

Example:
- The admin page can show total users, overdue tasks, and recent logins without making many separate requests.

This file is a good example of server-side aggregation.

## API Routes

All route files follow the same pattern:
1. Read the request.
2. Validate the input.
3. Check authentication when needed.
4. Call a service function.
5. Return JSON.
6. Use `routeErrorResponse()` for failures.

### `src/app/api/auth/register/route.ts`

- Reads the JSON body.
- Validates it with `registerSchema.safeParse()`.
- Calls `registerAccount()`.
- Sets the session cookie.
- Returns `201 Created`.

Example: if the body is invalid, the route returns `400` before touching the database.

### `src/app/api/auth/login/route.ts`

- Reads the JSON body.
- Validates it with `loginSchema`.
- Calls `loginAccount()`.
- Sets the session cookie.
- Returns `200 OK`.

Example: if the password is wrong, the service throws an unauthorized error and the route turns it into a 401 response.

### `src/app/api/auth/logout/route.ts`

- Reads the session cookie.
- Calls `logoutAccount()`.
- Clears the cookie in the response.
- Returns `200 OK`.

Example: logout is safe even if the cookie is missing. The UI still ends in a logged-out state.

### `src/app/api/auth/me/route.ts`

- Reads the session cookie.
- Resolves the current session.
- Returns the current user and session if authenticated.
- Returns `401` if not authenticated.

Example: this route answers the question, "Who is currently signed in?"

### `src/app/api/tasks/route.ts`

- `GET` returns the current user's dashboard snapshot.
- `POST` validates a new task with `taskSchema` and creates it.
- Both handlers require authentication.

Example: the dashboard page uses this route to load fresh data after a change.

### `src/app/api/tasks/[taskId]/route.ts`

- `PATCH` updates an existing task.
- `DELETE` removes a task.
- The route uses `context.params` to read `taskId`.
- The service layer checks that the task belongs to the current user.

Example: a user cannot update another user’s task because `getTaskOrThrow()` filters by both task ID and user ID.

### `src/app/api/admin/overview/route.ts`

- Checks authentication first.
- Checks whether the user role is `ADMIN`.
- Calls `getAdminOverview()`.
- Returns the admin summary JSON.

Example: a normal user gets redirected away from the admin page and also gets a 403 if they try the API directly.

## React App Shell and Pages

### `src/app/layout.tsx`

This is the root layout for the whole app.

- It imports `Metadata` so the page title and description are typed.
- It loads the `Space_Grotesk` and `Space_Mono` fonts.
- It wraps the app in `ThemeProvider`.
- `suppressHydrationWarning` avoids theme-related mismatch warnings.

Example: this file is like the frame around every page in the app.

### `src/app/page.tsx`

This is the landing page.

- It is a server component because it calls `getCurrentAuthContext()`.
- `dynamic = "force-dynamic"` makes sure the page checks auth on every request.
- It shows different call-to-action text depending on whether the user is signed in.
- It also shows product cards, feature highlights, and the admin account note.

Example: if the user is logged in, the main button says "Open app". If not, it says "Sign in".

### `src/app/auth/page.tsx`

This is the auth page wrapper.

- It checks whether the user is already signed in.
- If the user is signed in, it redirects to `/dashboard`.
- Otherwise it renders `AuthPanel()`.

Example: a logged-in user should not see the login form again.

### `src/app/dashboard/page.tsx`

This page loads the task dashboard.

- It checks the current session.
- If no user is signed in, it redirects to `/auth?next=/dashboard`.
- If the user is signed in, it loads the dashboard snapshot server-side.
- It passes that snapshot into `DashboardClient`.

Example: the first screen load already contains the task data, so the page feels fast.

### `src/app/admin/page.tsx`

This is the admin page wrapper.

- It checks whether the user is signed in.
- If not, it redirects to `/auth?next=/admin`.
- If the user is not an admin, it redirects to `/dashboard`.
- If the user is an admin, it loads the admin overview and passes it to `AdminClient`.

Example: this is a simple and safe role gate.

## React Components

### `src/components/theme-provider.tsx`

This file wraps the app in `next-themes`.

- `attribute="class"` makes the theme show up as a class on the HTML element.
- `defaultTheme="system"` follows the device theme first.
- `enableSystem` lets the app honor system settings.
- `disableTransitionOnChange` prevents theme switching from feeling jumpy.

Example: when the theme changes, the app can switch from light to dark without a reload.

### `src/components/theme-toggle.tsx`

This is the light/dark mode button.

- It is a client component because it uses hooks and browser APIs.
- `useTheme()` gives access to the current theme.
- The component waits until it is mounted before showing the final label.
- `requestAnimationFrame()` is used to avoid a hydration mismatch.
- `toggleTheme()` switches between light and dark, or follows the system preference when no theme is set.
- `aria-pressed` makes the button more accessible.

Example: if the system prefers dark mode, the button can start from that preference and then switch to light mode when clicked.

### `src/components/auth-panel.tsx`

This is the login and registration form.

Important pieces:
- `"use client"` makes the form run in the browser because it uses React state and click handlers.
- `AuthMode` is a union type that only allows `"login"` or `"register"`.
- `resolveRedirect()` makes sure the `next` query string is a safe internal path.
- `friendlyError()` converts unknown errors into a readable string.
- The component stores name, email, password, confirm password, and message in state.
- `handleSubmit()` sends a `fetch()` request to either `/api/auth/register` or `/api/auth/login`.
- `credentials: "include"` tells the browser to store the session cookie.
- After success, the component redirects with `router.replace(nextPath)` and refreshes the route.

Example:
- If the user clicks "Register", the form shows the name field and confirm password field.
- If the passwords do not match, the form shows an error before any API call happens.

This file is a good React lesson because it shows controlled inputs, form handling, and conditional UI.

### `src/components/dashboard-client.tsx`

This is the signed-in task dashboard.

Important pieces:
- `TaskFormState` describes the form values the user edits.
- `emptyForm` gives the form a clean starting state.
- `toIsoOrEmpty()` converts the local date picker value into ISO text for the API.
- `useDeferredValue()` slows down search filtering just enough to keep typing smooth.
- `useTransition()` lets snapshot updates happen without freezing the UI.
- `loadSnapshot()` refreshes task data from `/api/tasks` and redirects to auth if the session is gone.
- `saveTask()` creates or updates a task depending on whether `editingTask` exists.
- `quickUpdate()` changes task status with one button click.
- `removeTask()` asks for confirmation before deleting a task.
- `signOut()` logs the user out and redirects them to `/auth`.
- `filteredTasks` applies search, status, and priority filters before rendering.

Example:
- If you type "invoice" in search, only tasks with "invoice" in the title or description stay visible.
- If you change a task to `DONE`, the service layer may set `completedAt`.

This file teaches important React ideas:
- controlled forms
- smooth search filtering
- data refresh flows
- browser navigation with `useRouter()`

### `src/components/admin-client.tsx`

This is the admin dashboard.

Important pieces:
- It uses `useDeferredValue()` so search filtering stays smooth.
- It uses `useTransition()` so overview updates do not feel heavy.
- `refreshOverview()` reloads `/api/admin/overview`.
- If the API returns `401`, the user is sent to auth.
- If the API returns `403`, the user is sent back to the normal dashboard.
- `logFilter` lets the admin show only one kind of audit action.
- `filteredUsers` searches by name or email.
- `filteredActivity` searches by message, user name, and user email.
- `signOut()` logs out and sends the browser to `/auth`.

Example:
- If the admin chooses `TASK_CREATED` in the filter, only task-creation events appear.
- If the admin types part of an email address, both the user table and activity feed narrow down.

This file is a good example of an admin-style React dashboard with search, filters, and summary cards.

## How The Files Work Together

Here is the simple flow:

1. A page in `src/app` loads data on the server.
2. The page passes that data into a client component.
3. The client component lets the user interact with forms and buttons.
4. The client component calls an API route.
5. The API route validates the data and calls a service.
6. The service talks to Prisma and SQLite.
7. The service returns clean serialized data back to the browser.

That pattern repeats across login, tasks, and admin activity.

## Learning Notes For TypeScript

Some TypeScript ideas worth noticing in this project:

- `Readonly<{ children: ReactNode }>` in `layout.tsx` says the props should not be changed.
- `Promise<{ taskId: string }>` in the task route shows that route params can be awaited.
- `satisfies` in the service files checks the return shape without losing type inference.
- `Partial<TaskInput>` makes PATCH requests easier because every field becomes optional.
- `Record<TaskStatus, number>` is a strong way to store counters for known status keys.

Example:
- `type AuthMode = "login" | "register"` means TypeScript will reject any other string.
- That is why `setMode("settings")` would be a type error.

## Final Study Tip

If you want to learn the project quickly, trace one action from the UI all the way to the database.

- Registration: `AuthPanel` -> `register route` -> `auth-service` -> `session.ts` -> Prisma
- New task: `DashboardClient` -> `tasks route` -> `task-service` -> Prisma
- Admin review: `AdminClient` -> `admin overview route` -> `admin-service` -> Prisma

That is the easiest way to understand how React, TypeScript, and server code fit together.