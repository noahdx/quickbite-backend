# QuickBite — Backend API

Backend API for a food delivery platform built with **Node.js, Express, TypeScript, and PostgreSQL**.

The project handles restaurants, branches, products, customer addresses, authentication, and role-based access control for restaurant staff.

## Main Features

- Authentication with email/password
- JWT access and refresh tokens using `httpOnly` cookies
- Password reset and member invitations using OTP
- Restaurant and branch management
- Product and category management
- Per-branch product price, stock, and availability
- Customer delivery addresses
- Restaurant members and role-based permissions
- Branch-level access for restaurant staff
- Nearby branch search using PostGIS
- Centralized error handling
- Request correlation IDs for easier debugging
- Health endpoint for checking database connectivity

---

## Tech Stack

| Part                 | Technology              |
| -------------------- | ----------------------- |
| Runtime              | Node.js                 |
| Language             | TypeScript              |
| Framework            | Express 5               |
| Database             | PostgreSQL              |
| Query Builder        | Knex                    |
| Geospatial           | PostGIS                 |
| Authentication       | JWT + HTTP-only cookies |
| Validation           | class-validator + Zod   |
| Dependency Injection | tsyringe                |
| Cache                | Redis / ioredis         |

---

## Project Structure

```text
src/
├── app/
│   ├── auth/
│   ├── user/
│   ├── restaurant/
│   ├── branch/
│   ├── product/
│   ├── customer-address/
│   ├── rbac/
│   └── health/
│
├── lib/
│   ├── auth/
│   ├── config/
│   ├── di/
│   ├── error/
│   ├── http/
│   ├── knex/
│   ├── logger/
│   ├── types/
│   └── utils/
│
├── pkg/
│   └── cache/
│
├── migrations/
├── app.ts
├── routes.ts
└── server.ts
```

Each domain follows the same basic structure:

```text
domain/
├── routes.ts
├── controller/
├── service/
├── repository/
├── dto/
├── entity/
├── enums.ts
└── errors.ts
```

### Responsibilities

**Routes**

Define endpoints and middleware such as authentication and authorization.

**Controllers**

Handle HTTP-specific work: request parameters, validation, calling the service, and sending the response.

**Services**

Contain business logic and coordinate operations between different parts of the application. Transactions are also handled here.

**Repositories**

Handle database queries using Knex and map database rows from `snake_case` to application entities using `camelCase`.

**DTOs**

Define and validate incoming request data.

**Entities**

Represent the application's domain objects.

---

## Architecture

The application follows a simple layered architecture:

```text
Request
   │
   ▼
Route / Middleware
   │
   ▼
Controller
   │
   ▼
Service
   │
   ▼
Repository
   │
   ▼
PostgreSQL
```

The main rule is that business logic stays out of controllers and database access stays inside repositories.

For example:

```text
Controller
    ↓
Service
    ↓
Repository
    ↓
Database
```

This keeps HTTP handling, business rules, and database access separated.

---

## Authentication

Authentication uses JWTs stored in HTTP-only cookies.

There are two tokens:

- `access_token` — used to authenticate API requests
- `refresh_token` — used to obtain a new access token

The access token contains the authenticated user's basic context.

For restaurant users, this can include:

```ts
{
  (userId, email, role, restaurantId, restaurantRole, branchIds);
}
```

The authentication middleware reads the access token and attaches the authenticated user to:

```ts
req.user;
```

---

## Authorization (RBAC)

The project separates **system roles** from **restaurant roles**.

### System roles

```text
system_admin
customer
restaurant_user
delivery_agent
```

### Restaurant roles

```text
owner
branch_manager
staff
```

Restaurant permissions are represented as:

```text
resource + action
```

For example:

```text
core:product:create
core:product:read
core:member:update
```

Roles are connected to permissions through the RBAC tables.

The application uses middleware such as:

```ts
rbac(...)
requireRestaurantMember(...)
requireBranchAccess(...)
```

This allows an endpoint to check both the user's permission and whether the user belongs to the requested restaurant or branch.

---

## Database

PostgreSQL is used as the main database.

PostGIS is used for geographic queries such as finding branches near a given location.

The main relationships are:

```text
User
 ├── Customer Addresses
 ├── Restaurants
 │    ├── Branches
 │    ├── Categories
 │    │    └── Products
 │    └── Members
 │         └── Branch Access
 │
 └── Password Resets
```

Products have branch-specific information:

```text
Product
   │
   └── Product Branch Details
          ├── price
          ├── stock
          └── is_available
```

When a product is created, a database trigger creates its branch-specific records for the restaurant's existing branches.

---

## API Overview

Base URL:

```text
http://localhost:3000/api
```

### Authentication

```text
POST   /auth/register
POST   /auth/login
POST   /auth/refresh
POST   /auth/forget-password
POST   /auth/reset-password
POST   /auth/accept-invite
```

### User

```text
GET    /user/me
PATCH  /user/me
```

### Restaurants

```text
GET    /restaurants
GET    /restaurants/:id
POST   /restaurants
PATCH  /restaurants/:id
PATCH  /restaurants/:id/status
```

### Branches

```text
GET    /branches/nearby
GET    /restaurants/:restaurantId/branches
POST   /restaurants/:restaurantId/branches
PATCH  /branches/:branchId
PATCH  /branches/:branchId/status
```

### Products

```text
GET    /products/:productId
GET    /branches/:branchId/products
GET    /restaurants/:restaurantId/products
GET    /restaurants/:restaurantId/categories
POST   /restaurants/:restaurantId/products
PATCH  /products/:productId
```

### Restaurant Members

```text
GET    /restaurants/:restaurantId/members
POST   /restaurants/:restaurantId/members
PUT    /restaurants/:restaurantId/members/:memberId
DELETE /restaurants/:restaurantId/members/:memberId
```

### Customer Addresses

```text
GET    /customer/address
POST   /customer/address
PATCH  /customer/address/:addressId
DELETE /customer/address/:addressId
```

### Health

```text
GET    /health
```

---

## Error Handling

Expected application errors use `AppError`.

```ts
new AppError('Restaurant not found', 404);
```

The global error handler converts operational errors into HTTP responses.

Common status codes:

```text
400  Bad Request
401  Unauthorized
403  Forbidden
404  Not Found
409  Conflict
500  Internal Server Error
```

Unexpected errors are logged and returned as a generic `500` response.

---

## Environment Variables

Create a `.env` file based on `.env.example`.

Main configuration includes:

```env
PORT=3000

DB_HOST=localhost
DB_PORT=5432
DB_NAME=core_quickbite
DB_USERNAME=postgres
DB_PASSWORD=

ACCESS_SECRET=
REFRESH_SECRET=

ACCESS_EXPIRES_IN=
REFRESH_EXPIRES_IN=

CORS_ORIGINS=

REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
```

Environment variables are validated when the application starts.

---

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

```bash
cp .env.example .env
```

Update the database and authentication configuration.

### 3. Run migrations

```bash
npm run migrate:latest
```

### 4. Start the development server

```bash
npm run dev
```

The API will be available at:

```text
http://localhost:3000
```

Check the database connection:

```bash
curl http://localhost:3000/api/health
```

---

## Useful Commands

```bash
npm run dev
npm run build
npm start
npm run typecheck

npm run format
npm run format:check

npm run migrate:make
npm run migrate:latest
npm run migrate:rollback
```

---

## Design Decisions

A few conventions are used throughout the project:

### Database naming

Database columns use `snake_case`:

```text
restaurant_id
created_at
password_hash
```

Application objects use `camelCase`:

```ts
restaurantId;
createdAt;
passwordHash;
```

Repositories handle this mapping.

### Transactions

Services control transactions.

Repositories accept a database connection so they can work with either the normal database connection or a transaction:

```ts
repository.createUser(data, trx);
```

This keeps multi-step operations atomic.

### Thin controllers

Controllers are intentionally small.

They handle HTTP concerns and delegate business logic to services.

### Database responsibilities

Some consistency rules are enforced directly in PostgreSQL, such as product/branch records and geographic data.

### Authentication context

The authenticated user is available through:

```ts
req.user;
```

Restaurant context is included in the authentication flow so common requests do not need to repeatedly resolve the same information.
