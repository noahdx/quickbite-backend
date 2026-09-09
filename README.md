# Core QuickBite — Backend API

![CI](https://img.shields.io/github/actions/workflow/status/<your-user>/<your-repo>/ci.yml?branch=main&logo=github&label=CI)
![TypeScript](https://img.shields.io/badge/TypeScript-7-3178c6?logo=typescript&logoColor=white)
![Node](https://img.shields.io/badge/Node.js-%E2%89%A520-339933?logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-5-000000?logo=express)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL%20%2B%20PostGIS-4169e1?logo=postgresql&logoColor=white)
![License: MIT](https://img.shields.io/badge/license-MIT-blue)

REST backend for a multi-tenanted food-delivery platform: restaurants, branches, products,
customer delivery addresses, and an RBAC system for restaurant staff. Built with **Node.js,
Express 5, TypeScript, PostgreSQL (Knex + PostGIS), JWT + httpOnly cookies, tsyringe,
class-validator + Zod** — tested with **Vitest**, shipped with **Docker Compose**, and gated by a
**GitHub Actions** pipeline.

---

## Table of Contents

1. [Features](#features)
2. [Tech Stack](#tech-stack)
3. [Project Structure](#project-structure)
4. [Layered Architecture](#layered-architecture)
5. [Getting Started](#getting-started)
6. [Environment Variables](#environment-variables)
7. [Authentication & Sessions](#authentication--sessions)
8. [Authorization (RBAC)](#authorization-rbac)
9. [Domain Modules](#domain-modules)
10. [Database Schema](#database-schema)
11. [API Reference](#api-reference)
12. [Error Handling & Logging](#error-handling--logging)
13. [Design Decisions & Conventions](#design-decisions--conventions)
14. [npm Scripts](#npm-scripts)
15. [Known TODOs & Status](#known-todos--status)

---

## Features

- **Auth**: email/password registration & login, refresh-token rotation, OTP password reset,
  OTP-based member invite acceptance.
- **Sessions**: JWT access (1h) + refresh (7d) tokens delivered as **httpOnly cookies**
  (`access_token` + `refresh_token`); the refresh cookie is scoped to `/api/auth/refresh`.
- **Roles & Permissions (RBAC)**: system-level roles on users, plus per-restaurant member roles
  (`owner`, `branch_manager`, `staff`) with AWS-style `resource:action` permissions enforced by
  guard middleware.
- **Restaurants**: owner-created restaurants (registered inline during signup or via owner user),
  status lifecycle (`pending → active/suspended/disabled`).
- **Branches**: single restaurant can own many branches; **PostGIS** `geography(point,4326)`
  column generated from `lat`/`lng` for distance queries (find branches near coordinates).
- **Products**: categories per restaurant, products with **per-branch pricing/stock**; a DB
  trigger auto-creates `product_branch_details` rows for every existing branch when a product
  is inserted. Soft delete via `deleted_at`.
- **Customer addresses**: per-user delivery addresses with type (`office/home/public_place`)
  and default flag.
- **RBAC members**: assign staff to restaurants, gate them to branches, activate/suspend them.

---

## Tech Stack

| Concern             | Technology                                                                         |
| ------------------- | ---------------------------------------------------------------------------------- |
| Runtime             | Node.js ≥ 20, `tsx` (dev), Docker (multi-stage image)                              |
| Language            | TypeScript (strict, decorators + `emitDecoratorMetadata`)                          |
| Web framework       | Express 5                                                                          |
| ORM / query builder | Knex 3 + `pg`                                                                      |
| Database            | PostgreSQL (requires **PostGIS** extension)                                        |
| DI                  | tsyringe (`lib/di/container.ts`)                                                   |
| Validation          | class-validator + class-transformer (`validateBody`) and Zod (`env` schema)        |
| Auth                | jsonwebtoken, bcrypt, `crypto` OTP (SHA-256 hashed)                                |
| Cookies             | cookie-parser                                                                      |
| Cache               | ioredis (`RedisCacheProvider` in `pkg/cache`, `env.redis` wired, not yet consumed) |
| Logging             | small custom singleton logger (`console.log` JSON lines)                           |
| Tests               | Vitest + supertest (unit + integration), v8 coverage                               |
| Formatting          | Prettier (`format` / `format:check`)                                               |
| CI                  | GitHub Actions (typecheck → format → build → unit + integration tests)             |
| Misc                | uuid (correlation IDs), reflect-metadata                                           |

---

## Project Structure

```
src/
├── server.ts                  # Entrypoint — HTTP server, graceful shutdown (SIGINT/SIGTERM)
├── app.ts                     # Express app factory: helmet → cors → json → cookies → correlation → routes → errors
├── routes.ts                  # Mounts every domain router under /api
├── lib/
│   ├── config/env.ts          # Zod-validated environment (dotenv)
│   ├── correlation/correlationId.ts  # uuid per request, set as X-Correlation-ID header
│   ├── error/AppError.ts      # Operational error class (statusCode, isOperational)
│   ├── error/errorHandler.ts  # Global error middleware (logs + mapped JSON response)
│   ├── logger/logger.ts       # Singleton console logger
│   ├── knex/knex.ts           # Knex instance + pg BIGINT (int8) → Number parser
│   ├── knex/knexfile.ts       # Knex config for migration CLI
│   ├── auth/authenticate.ts   # Cookie JWT middleware → req.user
│   ├── auth/rbac.ts           # rbac(), requireRestaurantMember(), requireBranchAccess()
│   ├── auth/errors.ts         # NotAuthenticated / UnAuthorizedError
│   ├── di/                    # tsyringe container + registration tokens
│   ├── http/response.ts       # sendSuccess / sendPagination ({success, data} envelope)
│   ├── types/express.d.ts     # Express Request augmentation (user, correlationID)
│   └── utils/{cookie.ts, validation/validate.ts}
├── pkg/                       # Framework-agnostic packages
│   ├── cache/                 # ICacheProvider interface + RedisCacheProvider (ioredis)
│   └── utils/time.ts          # toMs() unit converter
├── app/
│   ├── auth/                  # register, login, refresh, forget/reset password, accept invite
│   ├── user/                  # /me profile
│   ├── restaurant/            # restaurants + inline owner creation
│   ├── branch/                # branches + PostGIS nearby search
│   ├── product/               # categories, products, per-branch details
│   ├── customer-address/      # user delivery addresses
│   ├── rbac/                  # permissions cache, roles, restaurant members, member-branches
│   └── health/                # /health — DB ping
└── migrations/                # Knex migrations (raw SQL), ordered by date
```

Each module inside `app/<domain>/` follows the same shape:

```
<domain>/
├── routes.ts          # Express-router → controller wiring + middleware chain
├── controller/        # HTTP concerns only (parse, validate, respond / next(error))
├── service/           # business logic + cross-module orchestration + transactions
├── repository/        # SQL access → maps DB rows to entities
├── dto/               # class-validator DTOs (request contracts)
├── entity/            # Domain entities (plain classes, camelCase)
├── enums.ts           # Domain enums
└── errors.ts          # Pre-built AppError singletons
```

---

## Layered Architecture

The request flows strictly in one direction — **never skip a layer from the outside**:

```
HTTP request
  └─> route (middleware: authenticate → rbac guards)
        └─> controller     parse params, validate body (validateBody), call service, respond
              └─> service  business rules, transaction orchestration, cross-module calls
                    └─> repository  raw SQL via db / trx, maps snake_case → entity
                          └─> PostgreSQL (PostGIS)
```

- **Controller**: the only layer that touches `Request`/`Response`. It converts params with
  `Number(...)`, validates bodies, and forwards errors with `next(error)` inside
  `try/catch { ... }`. Every handler follows the same template.
- **Service**: holds business logic (e.g. owner eligibility, membership creation, branch
  ownership checks) and manages transactions (`db.transaction()` + commit/rollback).
- **Repository**: exported functions (`createX`, `findXByY`) that run Knex queries. Each defines
  a `snake_case` row interface plus a private `toEntity()` mapper so the rest of the app only
  ever sees typed domain entities (camelCase).
- **DTOs**: `class-validator` decorators define the request contract. `validateBody(DTO, body)`
  whitelists unknown properties and throws on validation failure.
- **Entities**: plain classes (some with behavior, e.g. `PasswordReset.isExpired()`).

**Error convention**: business errors are module-level `AppError` singletons
(`UserNotFoundError`, `IncorrectCredentials`, …). The global `errorHandler` distinguishes
**operational** errors (returned to the client with their status code + message) from
non-operational ones (masked behind a generic 500).

---

## Getting Started

### Prerequisites

- Node.js ≥ 20
- PostgreSQL ≥ 12 with the **PostGIS** extension available
  (enabled automatically by the branch migration via `CREATE EXTENSION IF NOT EXISTS postgis`)

### Option A — Docker (recommended)

The repo ships a multi-stage `Dockerfile` + `docker-compose.yml` that brings up the API, a
PostGIS database, and Redis in one command:

```bash
docker compose up --build
```

The API container applies migrations on boot and then starts on `http://localhost:3000`.
Health check: `curl http://localhost:3000/api/health`

### Option B — Manual setup

```bash
# 1. Install dependencies
npm install

# 2. Create the environment file (see next section) and fill in the secrets
cp .env.example .env

# 3. Create the database (if it does not exist)
createdb core_quickbite

# 4. Run migrations — this also seeds the RBAC roles/permissions
npm run migrate:latest

# 5. Start the dev server (hot reload)
npm run dev
```

Health check: `curl http://localhost:3000/api/health`

### Testing

Unit tests need no database; integration tests need a migrated Postgres instance. They are
skipped automatically unless `RUN_INTEGRATION=1` is set.

```bash
npm test                  # unit tests only
npm run test:watch        # watch mode
npm run test:coverage     # unit tests + v8 coverage report
npm run test:integration  # integration tests (expects a migrated DB, same var conventions as setup)
```

CI (`.github/workflows/ci.yml`) runs typecheck → format check → build → unit tests against a
PostGIS service, then creates a test database, runs migrations, and executes the integration
suite.

### Production build

```bash
npm run build   # tsc → dist/
npm start       # node dist/server.js
```

> The pg driver returns `BIGINT` (int8) columns as strings by default. `knex.ts` registers a
> type parser so **all ids come back as JavaScript numbers** — do not re-cast them.

---

## Environment Variables

`src/lib/config/env.ts` validates them with Zod. Anything with a `.default()` is optional.

| Variable                 | Default                 | Description                              |
| ------------------------ | ----------------------- | ---------------------------------------- |
| `PORT`                   | `3000`                  | HTTP port                                |
| `NODE_ENV`               | `development`           | If `production`, cookies become `secure` |
| `DB_HOST`                | `localhost`             | Postgres host                            |
| `DB_PORT`                | `5432`                  | Postgres port                            |
| `DB_NAME`                | `core_quickbite`        | Database name                            |
| `DB_USERNAME`            | `postgres`              | Database user                            |
| `DB_PASSWORD`            | — (required)            | Database password                        |
| `DB_POOL_MIN`            | `2`                     | Knex pool min                            |
| `DB_POOL_MAX`            | `10`                    | Knex pool max                            |
| `ACCESS_SECRET`          | — (required)            | JWT signing secret for access tokens     |
| `REFRESH_SECRET`         | — (required)            | JWT signing secret for refresh tokens    |
| `ACCESS_EXPIRES_IN`      | `1h`                    | Access token lifetime                    |
| `REFRESH_EXPIRES_IN`     | `7d`                    | Refresh token lifetime                   |
| `CORS_ORIGINS`           | `http://localhost:8080` | Comma-separated list of allowed origins  |
| `REDIS_HOST`             | `localhost`             | Redis host                               |
| `REDIS_PORT`             | `6379`                  | Redis port                               |
| `REDIS_PASSWORD`         | — (required)            | Redis password (leave empty if no auth)  |
| `DB_MIGRATION_DIRECTORY` | `src/migrations`        | Migration folder (CLI only)              |
| `DB_MIGRATION_EXTENSION` | `ts`                    | Migration file extension (CLI only)      |

> Note: `ACCESS_EXPIRES_IN` / `REFRESH_EXPIRES_IN` are read with `Number(...)` in `env.ts` —
> supply them numerically (e.g. `3600`, `604800`) or the cookie `maxAge` semantics in
> `cookie.ts`/`auth.controller.ts` still assume `1h`/`7d` (`toMs`).

---

## Authentication & Sessions

`src/lib/auth/authenticate.ts` reads the JWT from the **`access_token` cookie**, verifies it
with `ACCESS_SECRET`, and hydrates `req.user`:

```ts
req.user = {
  userId, email, role,            // always
  restaurantId?, restaurantRole?, // restaurant users only
  branchIds?,
};
```

### Sign-up flows

- **Register** (`POST /auth/register`): blocked for `system_admin`.
  - If `role = restaurant_user`, a `restaurant` object is **required** (else `400`). A
    transaction creates user → restaurant (owner = user) → restaurant membership (role `owner`) →
    resolves the member's `roleName` + `branchIds` into the JWT payload.
  - Returns `accessToken` + `refreshToken` **and** sets both cookies.
- **Invite acceptance** (`POST /auth/accept-invite`): same payload as reset password; on success
  the member's status is activated (see [RBAC](#authorization-rbac)) — used for staff invited by
  an owner.
- **Login** (`POST /auth/login`): verifies bcrypt hash; restaurant users get their
  `restaurantId / restaurantRole / branchIds` embedded in the token.

### Password reset (OTP)

1. `POST /auth/forget-password` `{ email }` → generates a 6-digit OTP, stores its **SHA-256
   hash** in `password_resets` with a 10-minute expiry. Returns a generic message whether or not
   the account exists (enumeration-safe). **Sending the email is a TODO** — the OTP is currently
   only logged.
2. `POST /auth/reset-password` `{ email, otp, newPassword }` → hashes the input OTP, compares
   to the latest unconsumed, non-expired record, updates the password, marks the reset consumed.

### Refresh

- `POST /auth/refresh` reads the **`refresh_token`** cookie (path-restricted to this route —
  browsers won't send it elsewhere), verifies with `REFRESH_SECRET`, and issues a new
  `access_token` cookie. The refresh payload is rebuilt without restaurant context on refresh.

### Cookies

`setCookie()` (`lib/utils/cookie.ts`): `access_token` — `httpOnly`, 1h, root path;
`refresh_token` — `httpOnly`, 7d, `path=/api/auth/refresh`. Both `secure` only in production.

---

## Authorization (RBAC)

Two distinct concepts:

- **`users.system_role`** (`SystemRole`): `system_admin` | `customer` | `restaurant_user` |
  `delivery_agent`. A global identity on the account.
- **`restaurant_members`** → **`roles`**: `owner` | `branch_manager` | `staff`. A per-restaurant
  role for restaurant users, with a **status** (`active | inactive | suspended`).

### Permissions

`permissions` = `(resource, action)` pairs, AWS-style (`core:product:create`). `role_permissions`
maps roles to permissions. Seeded by `20260829235028_seed_rbac_data`:

| Role             | Permissions                                                                 |
| ---------------- | --------------------------------------------------------------------------- |
| `owner`          | **All** permissions                                                         |
| `branch_manager` | `core:product:create/read/update`, `core:member:read`, `core:branch:update` |
| `staff`          | `core:product:read`, `core:member:read`                                     |

Seeded resources: `core:product` (create/read/update), `core:member` (create/read/update/delete),
`core:branch` (create/update), `core:restaurant` (update).

### Guards (`lib/auth/rbac.ts`)

- `rbac({ resource, action, allowSystemAdmin? })` — **async**, loads the requester's permissions
  (cached — see `app/rbac/service/permission-cache.service`), allowing `system_admin` through by
  default; restaurant users must hold the permission; everyone else gets `403`.
- `requireRestaurantMember('restaurantId')` — params check; verifies a restaurant user's
  `req.user.restaurantId` matches the route param (system admins bypass).
- `requireBranchAccess('branchId')` — verifies the branch id is within `req.user.branchIds`. It
  honors the id from either a path param or a `?branchId=` query param, so it also protects
  endpoints that target a branch through the query string (e.g.
  `PATCH /products/:productId?branchId=`).

RBAC guard chains are wired on **member management**, **branch create/update/status**, and
**product create/read/update** routes, e.g.:

```
POST /restaurants/:restaurantId/members
  authenticate → requireRestaurantMember → rbac({create, core:member}) → controller
```

### Member lifecycle

- `GET /restaurants/:restaurantId/members` lists the restaurant's members.
- `POST /restaurants/:restaurantId/members` creates the member (joining an existing user
  via email/phone/role — see `rbac/dto/member.dto`), optionally assigns branch access
  (`member_branches`), can target a specific role with elevation/ownership checks.
- `PUT /restaurants/:restaurantId/members/:memberId` updates role/status/branches;
  `DELETE /restaurants/:restaurantId/members/:memberId` removes the membership.
- Invite acceptance activates an `inactive`/`suspended` member via `activateMemberByUserId`.

---

## Domain Modules

### auth

`login`, `register`, `refresh`, `forgetPassword`, `resetPassword`, `acceptInvite` — cookies set on
login/register, access cookie re-set on refresh.

### user

`GET/PATCH /user/me`; `PATCH` updates the **authenticated** user (never a route param) and returns
the fresh profile.

### restaurant

- `GET /` all, `GET /:id` by id.
- `POST /` authenticates the requester and creates the restaurant + its `owner` member. The
  requester must already be a `restaurant_user` (or system admin) — owner creation is validated.
- `PATCH /:id` rename / logo / country.
- `PATCH /:id/status` transition `pending/active/suspended/disabled`; non-system-admins cannot
  revert from certain states (guarded in service).

### branch

- `GET /branches/nearby?lng=&lat=` — PostGIS `ST_DWithin` over the generated `location`
  geography column within each branch's `delivery_radius` meters (see
  `branch/repository/branch.repository` → `NearbyBranch`).
- `GET /restaurants/:restaurantId/branches` — branches of a restaurant.
- `POST /restaurants/:restaurantId/branches` — only restaurant of the requester; validates the
  member is the owner (service) and sets `deliveryRadius` defaulting from a passed value.
- `PATCH /branches/:id`, `PATCH /branches/:id/status`.

### product

- `GET /products/:productId`, `GET /branches/:branchId/products` (per-branch view),
  `GET /restaurants/:restaurantId/products` (auth + ownership), `GET /restaurants/:restaurantId/categories`.
- `POST /restaurants/:restaurantId/products` — creates product (optionally a category); the DB
  trigger fans it out to every branch's `product_branch_details`.
- `PATCH /products/:productId?branchId=` — updates product fields and/or the per-branch
  price/stock/availability; guards soft-deleted products (`deleted_at`).

### customer-address

CRUD for the authenticated user's addresses; `isDefault` management, address ownership enforced,
`DELETE` guards the default address.

### health

`GET /health` — pings the DB and returns `200 OK` or `500 DB Down`.

---

## Database Schema

All ids are `BIGSERIAL` except `roles.id` (`SMALLSERIAL`, with matching `SMALLINT` FKs in
`role_permissions.role_id` and `restaurant_members.role_id`). `users.phone` must be unique for
the member-by-phone join in RBAC.

```
users (id, email UNIQUE, phone UNIQUE, name, password_hash, system_role
      CHECK in system_admin|customer|restaurant_user|delivery_agent, created_at, updated_at, deleted_at)
  │
  ├──<- customer_addresses (id, user_id FK, label, country, city, street, building?,
  │        apartment_number?, type CHECK in office|home|public_place, lat DECIMAL(10,7),
  │        lng DECIMAL(10,7), is_default)
  │
  ├──<- password_resets (id, user_id FK, otp_hash, expires_at, created_at, consumed_at?)
  │
  └──<- restaurants (id, owner_id FK→users, name UNIQUE, logo_url, status
            CHECK in active|suspended|disabled|pending, primary_country, created_at, updated_at, status_updated_at)
            │
            ├──<- restaurant_branches (id, restaurant_id FK, country_code, address_text,
            │        label, lng DECIMAL(9,6), lat DECIMAL(9,6), is_active, accept_orders,
            │        opens_at TIME, closes_at TIME, delivery_radius INT, currency CHAR(3),
            │        commission INT, created_at, updated_at,
            │        location geography(point,4326) GENERATED ALWAYS AS (ST_MakePoint(...)) STORED)   -- PostGIS
            │        └── GIST index on location
            │
            ├──<- product_categories (id, restaurant_id FK, name, UNIQUE(restaurant_id, name), timestamps)
            │        └──<- products (id, restaurant_id FK, category_id FK nullable, name, description,
            │                  img_url?, created_at, updated_at, deleted_at nullable)   -- soft delete
            │                  └──<- product_branch_details (id, branch_id FK, product_id FK,
            │                            price DECIMAL(6,2), stock INT, is_available,
            │                            UNIQUE(branch_id, product_id))
            │
            ├──<- restaurant_members (id, user_id FK, restaurant_id FK, role_id SMALLINT FK,
            │        status CHECK in active|inactive|suspended, timestamps, UNIQUE(user_id, restaurant_id))
            │        └──<- member_branches (member_id FK, branch_id FK, PK(member_id, branch_id))
            │
            └── roles (id SMALLSERIAL, name/display_name, description, timestamps, name UNIQUE)
                  └── role_permissions (role_id SMALLINT FK, permission_id BIGINT FK,
                        PK(role_id, permission_id))
                        └── permissions (id, resource, action, timestamps, UNIQUE(resource, action))
```

**DB-level automation**: a trigger `trg_product_after_insert` + function
`fn_insert_product_branch_details` inserts a `product_branch_details` row (price 0, stock 0,
unavailable) for **every branch of the product's restaurant** immediately after any product insert.
The PostGIS `location` column is a **generated stored** column — always consistent with `lat/lng`.

**Migration order** (run with `npm run migrate:latest`): users → customer_addresses →
password_resets → restaurants → restaurant_branches (adds PostGIS) → products (+ trigger) →
alter_products (category_id/deleted_at nullable) → RBAC tables → seed RBAC data.

---

## API Reference

Base URL: `http://localhost:3000/api`. Auth required = must send valid `access_token` cookie.

| Method | Path                                           | Auth           | Body / Query                      | Notes                                                                                |
| ------ | ---------------------------------------------- | -------------- | --------------------------------- | ------------------------------------------------------------------------------------ |
| GET    | `/health`                                      | —              | —                                 | DB health probe                                                                      |
| POST   | `/auth/register`                               | —              | `RegisterDTO`                     | `role` must not be `system_admin`; `restaurant` required when `role=restaurant_user` |
| POST   | `/auth/login`                                  | —              | `{email, password}`               | sets both cookies                                                                    |
| POST   | `/auth/refresh`                                | refresh cookie | —                                 | re-issues access cookie                                                              |
| POST   | `/auth/forget-password`                        | —              | `{email}`                         | generic response; OTP only logged (TODO)                                             |
| POST   | `/auth/reset-password`                         | —              | `{email, otp, newPassword}`       | resets password, marks OTP consumed                                                  |
| POST   | `/auth/accept-invite`                          | —              | `{email, otp, newPassword}`       | same + activates member status                                                       |
| GET    | `/user/me`                                     | ✅             | —                                 | current profile                                                                      |
| PATCH  | `/user/me`                                     | ✅             | profile fields                    | updates the authenticated user                                                       |
| GET    | `/customer/address`                            | ✅             | —                                 | list user addresses                                                                  |
| POST   | `/customer/address`                            | ✅             | `CreateAddressDTO`                |                                                                                      |
| PATCH  | `/customer/address/:addressId`                 | ✅             | `UpdateAddressDTO`                | owns + updates                                                                       |
| DELETE | `/customer/address/:addressId`                 | ✅             | —                                 | default address guarded                                                              |
| GET    | `/restaurants`                                 | —              | —                                 | all restaurants                                                                      |
| GET    | `/restaurants/:id`                             | —              | —                                 |                                                                                      |
| POST   | `/restaurants`                                 | ✅             | `CreateRestaurantDTO`             | makes requester the owner                                                            |
| PATCH  | `/restaurants/:id`                             | ✅             | `UpdatedRestaurantDTO`            |                                                                                      |
| PATCH  | `/restaurants/:id/status`                      | ✅             | `{status}`                        | status transitions                                                                   |
| GET    | `/branches/nearby`                             | —              | `?lng=&lat=` (Number)             | PostGIS radius search                                                                |
| GET    | `/restaurants/:restaurantId/branches`          | —              | —                                 |                                                                                      |
| POST   | `/restaurants/:restaurantId/branches`          | ✅             | `CreateBranchDTO`                 | owner only                                                                           |
| PATCH  | `/branches/:branchId`                          | ✅             | `UpdateBranchDTO`                 |                                                                                      |
| PATCH  | `/branches/:branchId/status`                   | ✅             | `{status}`                        | toggles active / commission                                                          |
| GET    | `/products/:productId`                         | —              | —                                 |                                                                                      |
| GET    | `/branches/:branchId/products`                 | —              | —                                 | per-branch pricing                                                                   |
| GET    | `/restaurants/:restaurantId/products`          | ✅             | —                                 | ownership checked                                                                    |
| GET    | `/restaurants/:restaurantId/categories`        | —              | —                                 |                                                                                      |
| POST   | `/restaurants/:restaurantId/products`          | ✅             | `CreateProductDTO`                | trigger fans out to branches                                                         |
| PATCH  | `/products/:productId`                         | ✅             | `?branchId=` + `UpdateProductDTO` | optional branch-level update                                                         |
| GET    | `/restaurants/:restaurantId/members`           | ✅ + RBAC      | —                                 | `requireRestaurantMember` + `rbac(core:member, read)`                                |
| POST   | `/restaurants/:restaurantId/members`           | ✅ + RBAC      | `CreateMemberDTO`                 | `requireRestaurantMember` + `rbac(core:member, create)`                              |
| PUT    | `/restaurants/:restaurantId/members/:memberId` | ✅ + RBAC      | `UpdateMemberDTO`                 | update role/status/branches                                                          |
| DELETE | `/restaurants/:restaurantId/members/:memberId` | ✅ + RBAC      | —                                 | `requireRestaurantMember` + `rbac(core:member, delete)`                              |

**Response envelope**: successful handlers reply through `sendSuccess`/`sendPagination`
(`lib/http/response.ts`) with a uniform `{ success: true, data, meta? }` body. Errors always come
back as `{ message }` with the operational status code.

**Validation conventions**: numeric path/query params are parsed with `Number(...)` directly in
controllers. Ids (`BIGSERIAL`) resolve to JS numbers thanks to the pg int8 parser.

---

## Error Handling & Logging

- `AppError(message, statusCode=500, isOperational=true)` — throw module-level singletons for
  expected failures. Timing/status areas: 400 validation, 401 auth, 403 forbidden, 404 not found,
  409 conflict.
- `errorHandler` (last middleware in `app.ts`): logs every error with
  `{operational, statusCode, correlationId, body, stack}`, returns
  operational errors as `{message}` with their status code, and masks non-operational errors to a
  generic `500 { message: "Something went wrong" }`.
- **Correlation**: every request gets a `uuidv4` stored on `req.correlationID` and mirrored on the
  response header `X-Correlation-ID`, so logs across a single request can be traced.
- **Logger**: `lib/logger/logger` — tiny singleton with `info/warn/debug/error`, prints one JSON
  line to stdout per event.

---

## Design Decisions & Conventions

1. **Strict TypeScript** — `strict`, `noImplicitAny`, `noUncheckedIndexedAccess`,
   `noImplicitOverride`, `noImplicitReturns`, `noFallthroughCasesInSwitch`, `noUnusedLocals`,
   `noUnusedParameters`; repositories expose typed row interfaces + `toEntity()` so `any` never
   escapes to higher layers.
2. **SQL in raw migrations** — schema is written as `knex.raw(...)` blocks (CHECK constraints,
   triggers, PostGIS, partial indexes) because Knex's query builder can't express them.
3. **snake_case DB ↔ camelCase app** — every repository maps rows; entities/DTDs are camelCase.
4. **Services own transactions** — repository functions accept an optional `conn: Knex` (default
   `db`) so services can run multi-step flows atomically (register, restaurant create).
5. **Controllers are thin and uniform** — `try { validate → service } catch (e) { next(e) }`;
   no SQL or business rules in HTTP layer.
6. **One `req.user` shape** — the Express augmentation lives in `lib/types/express.d.ts`;
   restaurant context rides inside the JWT, not re-fetched per request (except RBAC permission
   lookups, which are cached).
7. **BIGINT everywhere** — ids use `BIGSERIAL`/`BIGINT`; pg int8 parser converts to `number`
   centrally so no controller/service ever casts.
8. **DB does the fan-out** — product→branch availability is guaranteed by trigger, not application
   code, avoiding drift.
9. **operational vs programmer errors** — only operational errors bubble their message to clients;
   internal failures are logged with correlation id and masked.
10. **Generated PostGIS geography** — `location` is _stored generated_, so lat/lng edits stay in
    sync and GIST lookups are fast.

---

## npm Scripts

| Script             | Command                        | Purpose                                 |
| ------------------ | ------------------------------ | --------------------------------------- |
| `dev`              | `tsx watch src/server.ts`      | Run with hot reload                     |
| `build`            | `tsc`                          | Emit to `dist/`                         |
| `start`            | `node dist/server.js`          | Run compiled output                     |
| `typecheck`        | `tsc --noEmit`                 | Type-check without emitting             |
| `test`             | `vitest run`                   | Run unit tests                          |
| `test:watch`       | `vitest`                       | Run tests in watch mode                 |
| `test:integration` | `vitest run tests/integration` | Integration tests (`RUN_INTEGRATION=1`) |
| `test:coverage`    | `vitest run --coverage`        | Unit tests + v8 coverage                |
| `format`           | `prettier --write .`           | Format the whole repo                   |
| `format:check`     | `prettier --check .`           | Verify formatting (CI)                  |
| `migrate:make`     | knex `migrate:make`            | Scaffold a new migration                |
| `migrate:latest`   | knex `migrate:latest`          | Apply pending migrations (seeds RBAC)   |
| `migrate:rollback` | knex `migrate:rollback`        | Roll back the last batch                |

---

## Known TODOs & Status

- **OTP email delivery** — the reset/invite OTP is only logged (`logger.info`); actual email
  sending (e.g. nodemailer/SES) is a TODO (`auth.service.ts`).
- **RBAC adoption** — the guard chain (`rbac/requireRestaurantMember/requireBranchAccess`) is
  applied to member management and to branch/product routes; remaining restaurant routes rely on
  in-service ownership checks.
- Refresh tokens are **not stored/revoked server-side**; the refresh endpoint re-signs from the
  cookie. Rotation/blacklisting (using the Redis provider in `pkg/cache`) would strengthen this.
- The Redis provider (`pkg/cache/redis.ts`) is implemented but not yet consumed by any service.
- Duplicate-email/phone on register surfaces as a generic `500` behind the error handler instead
  of a `409` — a unique-violation mapping would clean this up.

```

```
