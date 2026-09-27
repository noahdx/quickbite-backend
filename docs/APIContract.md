# QuickBite API Contract

Base URL: `http://localhost:3000/api`

Content type: `application/json`

Auth: JWT in cookies (`access_token` 1 hour, `refresh_token` 7 days)

Roles: `system_admin` (all restaurants) · `customer` (self only) · `restaurant_user` (own restaurant, own branches)

Restaurant roles: `owner` (all) · `branch_manager` (branch + product) · `staff` (read only)

| #   | Module     | Endpoints                                                                                             |
| --- | ---------- | ----------------------------------------------------------------------------------------------------- |
| 1   | Auth       | 1.1 Register · 1.2 Login · 1.3 Forget Password · 1.4 Reset Password · 1.5 Accept Invite · 1.6 Refresh |
| 2   | User       | 2.1 Get Profile · 2.2 Update Profile                                                                  |
| 3   | Address    | 3.1 List · 3.2 Create · 3.3 Update · 3.4 Delete                                                       |
| 4   | Restaurant | 4.1 List · 4.2 Get · 4.3 Create · 4.4 Update · 4.5 Update Status                                      |
| 5   | Branch     | 5.1 Nearby · 5.2 List · 5.3 Create · 5.4 Update · 5.5 Update Status                                   |
| 6   | Product    | 6.1 Get · 6.2 Branch Menu · 6.3 List by Restaurant · 6.4 Create · 6.5 Update · 6.6 Categories         |
| 7   | Member     | 7.1 List · 7.2 Invite · 7.3 Update · 7.4 Remove                                                       |
| 8   | Health     | 8.1 Health Check                                                                                      |

Every success response is wrapped: `{ "success": true, "data": { "message": "...", "data": ... } }`
Every error is: `{ "message": "..." }`

---

## 1. Auth

### 1.1 Register

POST /api/auth/register

Body

```json
{
  "email": "owner@pizzapalace.com",
  "phone": "+201001234567",
  "name": "Ahmed Ali",
  "role": "restaurant_user",
  "password": "Str0ng!Pass",
  "restaurant": { "name": "Pizza Palace", "logoURL": "https://cdn.quickbite.com/p.png", "primaryCountry": "EG" }
}
```

Response 200

```json
{
  "success": true,
  "data": {
    "message": "User registered successfully",
    "accessToken": "eyJhbGciOi...",
    "refreshToken": "eyJhbGciOi...",
    "user": {
      "id": 12,
      "email": "owner@pizzapalace.com",
      "phone": "+201001234567",
      "role": "restaurant_user",
      "createdAt": "2026-09-26T10:00:00.000Z"
    },
    "restaurant": {
      "id": 4,
      "ownerId": 12,
      "name": "Pizza Palace",
      "logoURL": "",
      "status": "pending",
      "primaryCountry": "EG",
      "createdAt": "2026-09-26T10:00:00.000Z",
      "updatedAt": "2026-09-26T10:00:00.000Z",
      "statusUpdatedAt": "2026-09-26T10:00:00.000Z"
    }
  }
}
```

Rules

- email valid email · phone international phone number · name 3 to 50 chars
- role `customer` or `restaurant_user` or `delivery_agent`
- password 8+ chars with 1 upper, 1 lower, 1 number, 1 symbol
- restaurant required when role is `restaurant_user`, otherwise leave it out
- restaurant returns `null` for other roles
- sets access_token and refresh_token cookies
- 400 bad input or email already used, 403 system admin cannot self register

### 1.2 Login

POST /api/auth/login

Body

```json
{ "email": "owner@pizzapalace.com", "password": "Str0ng!Pass" }
```

Response 200

```json
{
  "success": true,
  "data": {
    "message": "Login successfully",
    "accessToken": "eyJhbGciOi...",
    "refreshToken": "eyJhbGciOi...",
    "user": {
      "id": 12,
      "email": "owner@pizzapalace.com",
      "phone": "+201001234567",
      "role": "restaurant_user",
      "createdAt": "2026-09-26T10:00:00.000Z"
    }
  }
}
```

Rules

- email valid email · password not empty
- sets access_token and refresh_token cookies
- 400 bad input, 401 wrong email or password

### 1.3 Forget Password

POST /api/auth/forget-password

Header: `Idempotency-Key` required, any unique string

Body

```json
{ "email": "owner@pizzapalace.com" }
```

Response 200

```json
{ "success": true, "data": { "message": "Email Sent with OTP" } }
```

Rules

- sends a 6 digit OTP to the email
- same key returns the same result and sends no second email
- unknown email returns the same answer
- 400 bad input or missing Idempotency-Key, 503 cache service down

### 1.4 Reset Password

POST /api/auth/reset-password

Body

```json
{ "email": "owner@pizzapalace.com", "otp": "123456", "newPassword": "N3w!Pass" }
```

Response 200

```json
{ "success": true, "data": { "message": "Password reset successfully, please login again" } }
```

Rules

- otp exactly 6 digits
- newPassword 8+ chars with 1 upper, 1 lower, 1 number, 1 symbol
- user must log in again after this
- 400 bad input, 401 wrong or expired OTP

### 1.5 Accept Invite

POST /api/auth/accept-invite

Body

```json
{ "email": "omar@pizzapalace.com", "otp": "123456", "newPassword": "N3w!Pass" }
```

Response 200

```json
{ "success": true, "data": { "message": "Password reset successfully, please login again" } }
```

Rules

- same body and rules as 1.4 Reset Password
- also switches the invited member to active
- 400 bad input, 401 wrong or expired OTP

### 1.6 Refresh

POST /api/auth/refresh

Body
none

Response 200

```json
{ "success": true, "data": { "message": "Success", "accessToken": "eyJhbGciOi..." } }
```

Rules

- reads the refresh_token cookie and sets a new access_token
- 401 if the cookie is missing or expired

---

## 2. User

### 2.1 Get Profile

GET /api/user/me

Body
none

Response 200

```json
{
  "success": true,
  "data": {
    "message": "User retrieved successfully",
    "user": {
      "id": 12,
      "email": "customer@mail.com",
      "phone": "+201001234567",
      "role": "customer",
      "createdAt": "2026-09-26T10:00:00.000Z"
    }
  }
}
```

Rules

- needs login, any role
- 401 not logged in, 404 user not found

### 2.2 Update Profile

PATCH /api/user/me

Body

```json
{ "name": "Sara A.", "phone": "01001234567" }
```

Response 200

```json
{
  "success": true,
  "data": {
    "message": "User profile update successfully",
    "user": {
      "id": 12,
      "email": "customer@mail.com",
      "phone": "01001234567",
      "role": "customer",
      "createdAt": "2026-09-26T10:00:00.000Z"
    }
  }
}
```

Rules

- both fields optional, send only what changes
- name 1 or more chars, phone 10 to 11 chars
- 400 bad input, 401 not logged in, 404 user not found

---

## 3. Address

Works on the logged in user only. Setting `isDefault: true` clears the flag on the other addresses.

### 3.1 List Addresses

GET /api/customer/address

Body
none

Response 200

```json
{
  "success": true,
  "data": {
    "message": "Addresses retrieved successfully",
    "data": [
      {
        "id": 3,
        "label": "Home",
        "country": "Egypt",
        "city": "Cairo",
        "street": "Tahrir St",
        "building": "15",
        "apartmentNumber": "4th floor",
        "type": "home",
        "lat": 30.0444,
        "lng": 31.2357,
        "isDefault": true
      }
    ]
  }
}
```

Rules

- needs login
- type is `home` or `office` or `public_place`
- 401 not logged in

### 3.2 Create Address

POST /api/customer/address

Body

```json
{
  "label": "Home",
  "country": "Egypt",
  "city": "Cairo",
  "street": "Tahrir St",
  "building": "15",
  "apartmentNumber": "4th floor",
  "type": "home",
  "lat": 30.0444,
  "lng": 31.2357,
  "isDefault": true
}
```

Response 200

```json
{
  "success": true,
  "data": {
    "message": "Address created successfully",
    "data": {
      "id": 3,
      "label": "Home",
      "country": "Egypt",
      "city": "Cairo",
      "street": "Tahrir St",
      "building": "15",
      "apartmentNumber": "4th floor",
      "type": "home",
      "lat": 30.0444,
      "lng": 31.2357,
      "isDefault": true
    }
  }
}
```

Rules

- label, country, city, street required and not empty
- building and apartmentNumber optional
- type `home` or `office` or `public_place`
- lat −90 to 90, lng −180 to 180
- isDefault true or false
- 400 bad input, 401 not logged in

### 3.3 Update Address

PATCH /api/customer/address/:addressId

Body

```json
{ "label": "Work", "city": "Giza", "isDefault": true }
```

Response 200

```json
{
  "success": true,
  "data": {
    "message": "Address updated successfully",
    "data": {
      "id": 3,
      "label": "Work",
      "country": "Egypt",
      "city": "Giza",
      "street": "Tahrir St",
      "building": "15",
      "apartmentNumber": "4th floor",
      "type": "home",
      "lat": 30.0444,
      "lng": 31.2357,
      "isDefault": true
    }
  }
}
```

Rules

- all fields optional, send only what changes
- same rules as 3.2 Create Address
- 400 bad input, 401 not logged in, 404 address not found or belongs to someone else

### 3.4 Delete Address

DELETE /api/customer/address/:addressId

Body
none

Response 200

```json
{ "success": true, "data": { "message": "Address deleted successfully" } }
```

Rules

- 401 not logged in, 404 address not found or belongs to someone else

---

## 4. Restaurant

### 4.1 List Restaurants

GET /api/restaurants

Body
none

Query: `limit` (default 10, max 100) · `cursor` (last id from the previous page) · `field` (sort field, default id) · `orderBy` (asc or desc) · `filter[status][eq]=active` · `filter[name][like]=pizza` · `filter[id][eq]=4`
Filter operators: `eq`, `gt`, `gte`, `lt`, `lte`, `in`, `like`

Example

```text
/api/restaurants?limit=20&orderBy=desc&filter[status][eq]=active
```

Response 200

```json
{
  "success": true,
  "data": [
    {
      "id": 4,
      "ownerId": 12,
      "name": "Pizza Palace",
      "logoURL": "https://cdn.quickbite.com/p.png",
      "status": "active",
      "primaryCountry": "EG",
      "createdAt": "2026-09-26T10:00:00.000Z",
      "updatedAt": "2026-09-26T10:00:00.000Z",
      "statusUpdatedAt": "2026-09-26T10:00:00.000Z"
    }
  ],
  "meta": { "nextCursor": "4", "hasMore": false, "count": 1 }
}
```

Rules

- public, no login needed
- status is `active` or `suspended` or `disabled` or `pending`
- filter fields: `id`, `name`, `status`
- meta.nextCursor is null on the last page

### 4.2 Get Restaurant

GET /api/restaurants/:id

Body
none

Response 200

```json
{
  "success": true,
  "data": {
    "message": "Restaurant retrieved successfully",
    "data": {
      "id": 4,
      "ownerId": 12,
      "name": "Pizza Palace",
      "logoURL": "https://cdn.quickbite.com/p.png",
      "status": "active",
      "primaryCountry": "EG",
      "createdAt": "2026-09-26T10:00:00.000Z",
      "updatedAt": "2026-09-26T10:00:00.000Z",
      "statusUpdatedAt": "2026-09-26T10:00:00.000Z"
    }
  }
}
```

Rules

- public, no login needed
- 404 restaurant not found
- known bug: the route uses `:id` but the code reads `restaurantId`, so this always returns 404 until it is fixed

### 4.3 Create Restaurant

POST /api/restaurants

Body

```json
{
  "name": "Pizza Palace",
  "logoURL": "https://cdn.quickbite.com/p.png",
  "primaryCountry": "EG",
  "owner": { "email": "owner@pizzapalace.com", "phone": "+201001234567", "name": "Ahmed Ali", "password": "Str0ng!Pass" }
}
```

Response 200

```json
{
  "success": true,
  "data": {
    "message": "Restaurant and owner created successfully",
    "restaurant": {
      "id": 4,
      "ownerId": 12,
      "name": "Pizza Palace",
      "logoURL": "",
      "status": "active",
      "primaryCountry": "EG",
      "createdAt": "2026-09-26T10:00:00.000Z",
      "updatedAt": "2026-09-26T10:00:00.000Z",
      "statusUpdatedAt": "2026-09-26T10:00:00.000Z"
    },
    "owner": {
      "email": "owner@pizzapalace.com",
      "phone": "+201001234567",
      "name": "Ahmed Ali",
      "createdAt": "2026-09-26T10:00:00.000Z"
    }
  }
}
```

Rules

- system_admin only
- owner must be a new email, the owner account and restaurant are created together
- owner.password same strength rules as 1.1 Register
- new restaurant starts with status active
- 400 bad input, 401 not logged in, 403 not allowed, 409 owner email already used

### 4.4 Update Restaurant

PATCH /api/restaurants/:restaurantId

Body

```json
{ "name": "Pizza Palace Downtown", "logoURL": "https://cdn.quickbite.com/p.png", "primaryCountry": "EG" }
```

Response 200

```json
{
  "success": true,
  "data": {
    "message": "Restaurant updated successfully",
    "data": {
      "id": 4,
      "ownerId": 12,
      "name": "Pizza Palace Downtown",
      "logoURL": "https://cdn.quickbite.com/p.png",
      "status": "active",
      "primaryCountry": "EG",
      "createdAt": "2026-09-26T10:00:00.000Z",
      "updatedAt": "2026-09-26T10:00:00.000Z",
      "statusUpdatedAt": "2026-09-26T10:00:00.000Z"
    }
  }
}
```

Rules

- all fields optional, send only what changes
- name and primaryCountry 1 or more chars
- needs login, must belong to this restaurant, permission `core:restaurant:update`
- 400 bad input, 401 not logged in, 403 no permission or other restaurant, 404 restaurant not found

### 4.5 Update Restaurant Status

PATCH /api/restaurants/:restaurantId/status

Body

```json
{ "status": "suspended" }
```

Response 200

```json
{
  "success": true,
  "data": {
    "message": "Restaurant status updated successfully",
    "data": {
      "id": 4,
      "ownerId": 12,
      "name": "Pizza Palace",
      "logoURL": "",
      "status": "suspended",
      "primaryCountry": "EG",
      "createdAt": "2026-09-26T10:00:00.000Z",
      "updatedAt": "2026-09-26T10:00:00.000Z",
      "statusUpdatedAt": "2026-09-26T12:00:00.000Z"
    }
  }
}
```

Rules

- system_admin only
- status is `active` or `suspended` or `disabled` or `pending`
- 400 bad input, 401 not logged in, 403 not allowed, 404 restaurant not found

---

## 5. Branch

### 5.1 Nearby Branches

GET /api/branches/nearby

Body
none

Query: `lat` and `lng`, both required

Example

```text
/api/branches/nearby?lat=30.0444&lng=31.2357
```

Response 200

```json
{
  "success": true,
  "data": {
    "message": "Branches retrieved successfully",
    "data": [
      {
        "id": 9,
        "restaurantId": 4,
        "addressText": "15 Tahrir St, Downtown",
        "label": "Downtown branch",
        "lat": 30.0444,
        "lng": 31.2357,
        "isActive": true,
        "acceptOrders": true,
        "currency": "EGP",
        "restaurantName": "Pizza Palace",
        "restaurantLogoUrl": "https://cdn.quickbite.com/p.png"
      }
    ]
  }
}
```

Rules

- public, cached for one hour, `X-Cache` header tells hit or miss
- returns only active branches of active restaurants that deliver to that point
- lat −90 to 90, lng −180 to 180

### 5.2 List Branches

GET /api/restaurants/:restaurantId/branches

Body
none

Response 200

```json
{
  "success": true,
  "data": {
    "message": "Branches retrieved successfully",
    "data": [
      {
        "id": 9,
        "restaurantId": 4,
        "countryCode": "EG",
        "addressText": "15 Tahrir St, Downtown",
        "label": "Downtown branch",
        "lat": 30.0444,
        "lng": 31.2357,
        "isActive": true,
        "acceptOrders": true,
        "opensAt": "10:00",
        "closesAt": "23:00",
        "deliveryRadius": 5,
        "currency": "EGP",
        "commission": 10,
        "createdAt": "2026-09-26T10:00:00.000Z",
        "updatedAt": "2026-09-26T10:00:00.000Z"
      }
    ]
  }
}
```

Rules

- public, no login needed
- currency is `EGP` or `SAR`
- deliveryRadius is in km, commission is a percent
- opensAt and closesAt are `HH:mm`

### 5.3 Create Branch

POST /api/restaurants/:restaurantId/branches

Body

```json
{
  "label": "Downtown branch",
  "addressText": "15 Tahrir St, Downtown",
  "lat": 30.0444,
  "lng": 31.2357,
  "opensAt": "10:00",
  "closesAt": "23:00",
  "deliveryRadius": 5,
  "currency": "EGP",
  "countryCode": "EG"
}
```

Response 200

```json
{
  "success": true,
  "data": {
    "message": "Branch created successfully",
    "data": {
      "id": 9,
      "restaurantId": 4,
      "countryCode": "EG",
      "addressText": "15 Tahrir St, Downtown",
      "label": "Downtown branch",
      "lat": 30.0444,
      "lng": 31.2357,
      "isActive": false,
      "acceptOrders": true,
      "opensAt": "10:00",
      "closesAt": "23:00",
      "deliveryRadius": 5,
      "currency": "EGP",
      "commission": 0,
      "createdAt": "2026-09-26T10:00:00.000Z",
      "updatedAt": "2026-09-26T10:00:00.000Z"
    }
  }
}
```

Rules

- label 1 to 100 chars, addressText 1 to 500 chars
- lat −90 to 90, lng −180 to 180
- opensAt and closesAt are `HH:mm`
- deliveryRadius km, 0 or more
- currency `EGP` or `SAR`, countryCode ISO code such as `EG`
- new branch starts with isActive false, acceptOrders true, commission 0
- needs login, must belong to this restaurant, permission `core:branch:create`
- 400 bad input, 401 not logged in, 403 no permission or other restaurant, 404 member not found

### 5.4 Update Branch

PATCH /api/branches/:branchId

Body

```json
{
  "label": "Downtown branch",
  "addressText": "15 Tahrir St",
  "lat": 30.0444,
  "lng": 31.2357,
  "opensAt": "10:00",
  "closesAt": "23:00",
  "deliveryRadius": 7,
  "currency": "EGP",
  "acceptOrders": false
}
```

Response 200

```json
{
  "success": true,
  "data": {
    "message": "Branch updated successfully",
    "data": {
      "id": 9,
      "restaurantId": 4,
      "countryCode": "EG",
      "addressText": "15 Tahrir St",
      "label": "Downtown branch",
      "lat": 30.0444,
      "lng": 31.2357,
      "isActive": true,
      "acceptOrders": false,
      "opensAt": "10:00",
      "closesAt": "23:00",
      "deliveryRadius": 7,
      "currency": "EGP",
      "commission": 10,
      "createdAt": "2026-09-26T10:00:00.000Z",
      "updatedAt": "2026-09-26T10:00:00.000Z"
    }
  }
}
```

Rules

- all fields optional, send only what changes
- same field rules as 5.3 Create Branch
- isActive and commission are changed in 5.5, not here
- needs login, must have access to this branch, permission `core:branch:update`
- 400 bad input, 401 not logged in, 403 no permission or other branch, 404 branch not found

### 5.5 Update Branch Status

PATCH /api/branches/:branchId/status

Body

```json
{ "isActive": true, "commission": 10 }
```

Response 200

```json
{
  "success": true,
  "data": {
    "message": "Branch status updated successfully",
    "data": {
      "id": 9,
      "restaurantId": 4,
      "countryCode": "EG",
      "addressText": "15 Tahrir St",
      "label": "Downtown branch",
      "lat": 30.0444,
      "lng": 31.2357,
      "isActive": true,
      "acceptOrders": true,
      "opensAt": "10:00",
      "closesAt": "23:00",
      "deliveryRadius": 5,
      "currency": "EGP",
      "commission": 10,
      "createdAt": "2026-09-26T10:00:00.000Z",
      "updatedAt": "2026-09-26T10:00:00.000Z"
    }
  }
}
```

Rules

- both fields optional, send only what changes
- isActive true publishes the branch and false hides it
- commission 0 to 100
- needs login, must have access to this branch, permission `core:branch:update`
- 400 bad input, 401 not logged in, 403 no permission or other branch, 404 branch not found

---

## 6. Product

### 6.1 Get Product

GET /api/products/:productId

Body
none

Response 200

```json
{
  "success": true,
  "data": {
    "message": "Product retrieved successfully",
    "data": {
      "id": 55,
      "restaurantId": 4,
      "categoryId": 7,
      "name": "Margherita",
      "description": "Tomato, mozzarella, basil",
      "imageUrl": "https://cdn.quickbite.com/m.png",
      "createdAt": "2026-09-26T10:00:00.000Z",
      "updatedAt": "2026-09-26T10:00:00.000Z"
    }
  }
}
```

Rules

- public, no login needed
- 404 product not found

### 6.2 Branch Menu

GET /api/branches/:branchId/products

Body
none

Response 200

```json
{
  "success": true,
  "data": {
    "message": "Products retrieved successfully",
    "data": [
      {
        "id": 55,
        "name": "Margherita",
        "description": "Tomato, mozzarella, basil",
        "imageUrl": "https://cdn.quickbite.com/m.png",
        "restaurantId": 4,
        "categoryId": 7,
        "categoryName": "Pizza",
        "price": 220,
        "stock": 40,
        "isAvailable": true
      }
    ]
  }
}
```

Rules

- public, cached for one hour
- this is the customer menu of the branch, with that branch price and stock
- price is a whole number in the branch currency, stock 0 or more

### 6.3 List by Restaurant

GET /api/restaurants/:restaurantId/products

Body
none

Query: `limit` (default 10, max 100) · `cursor` · `field` · `orderBy` · `filter[name][like]=pizza` · `filter[category_id][eq]=7` · `filter[created_at][gte]=2026-09-01`

Response 200

```json
{
  "success": true,
  "data": [
    {
      "id": 55,
      "restaurantId": 4,
      "categoryId": 7,
      "name": "Margherita",
      "description": "Tomato, mozzarella, basil",
      "imageUrl": "https://cdn.quickbite.com/m.png",
      "createdAt": "2026-09-26T10:00:00.000Z",
      "updatedAt": "2026-09-26T10:00:00.000Z"
    }
  ],
  "meta": { "nextCursor": "55", "hasMore": false, "count": 1 }
}
```

Rules

- staff view, needs login, must belong to this restaurant, permission `core:product:read`
- cached for one hour
- filter fields: `restaurant_id`, `name`, `category_id`, `created_at`
- 401 not logged in, 403 no permission or other restaurant

### 6.4 Create Product

POST /api/restaurants/:restaurantId/products

Body

```json
{
  "name": "Margherita",
  "description": "Tomato, mozzarella, basil",
  "imageUrl": "https://cdn.quickbite.com/m.png",
  "categoryName": "Pizza"
}
```

Response 200

```json
{
  "success": true,
  "data": {
    "message": "Product created successfully",
    "data": {
      "id": 55,
      "restaurantId": 4,
      "categoryId": 7,
      "name": "Margherita",
      "description": "Tomato, mozzarella, basil",
      "imageUrl": "https://cdn.quickbite.com/m.png",
      "createdAt": "2026-09-26T10:00:00.000Z",
      "updatedAt": "2026-09-26T10:00:00.000Z"
    }
  }
}
```

Rules

- name required and not empty
- description, imageUrl, categoryName optional
- categoryName creates the category if this restaurant does not have it yet
- needs login, must belong to this restaurant, permission `core:product:create`
- 400 bad input, 401 not logged in, 403 no permission or other restaurant, 404 restaurant not found

### 6.5 Update Product

PATCH /api/branches/:branchId/products/:productId

Body

```json
{
  "name": "Margherita",
  "description": "Tomato, mozzarella, basil",
  "imageUrl": "https://cdn.quickbite.com/m.png",
  "categoryName": "Pizza",
  "price": 240,
  "stock": 12,
  "isAvailable": true
}
```

Response 200

```json
{
  "success": true,
  "data": {
    "message": "Product updated successfully",
    "data": [
      {
        "id": 55,
        "restaurantId": 4,
        "categoryId": 7,
        "name": "Margherita",
        "description": "Tomato, mozzarella, basil",
        "imageUrl": "https://cdn.quickbite.com/m.png",
        "createdAt": "2026-09-26T10:00:00.000Z",
        "updatedAt": "2026-09-26T10:00:00.000Z"
      },
      { "id": 90, "branchId": 9, "productId": 55, "price": 240, "stock": 12, "isAvailable": true }
    ]
  }
}
```

Rules

- all fields optional, send only what changes
- name, description, imageUrl, categoryName change the product
- price, stock, isAvailable change only this branch, price 0 or more, stock 0 or more
- response data is an array, first item is the product, second item is the branch override and is `null` if no branch field was sent
- needs login, must have access to this branch, permission `core:product:update`
- 400 bad input, 401 not logged in, 403 no permission or other branch, 404 product or restaurant not found

### 6.6 Categories

GET /api/restaurants/:restaurantId/categories

Body
none

Response 200

```json
{
  "success": true,
  "data": {
    "message": "Categories retrieved successfully",
    "data": [
      {
        "id": 7,
        "restaurantId": 4,
        "name": "Pizza",
        "createdAt": "2026-09-26T10:00:00.000Z",
        "updatedAt": "2026-09-26T10:00:00.000Z"
      }
    ]
  }
}
```

Rules

- public, cached for one hour

---

## 7. Member

Restaurant staff. Every endpoint needs login, must belong to that restaurant, and needs a `core:member` permission.

### 7.1 List Members

GET /restaurants/:restaurantId/members

Body
none

Response 200

```json
{
  "success": true,
  "data": {
    "message": "Members retrieved successfully",
    "data": [
      {
        "id": 21,
        "userId": 31,
        "name": "Omar Ali",
        "email": "omar@pizzapalace.com",
        "phone": "+201009999888",
        "role": "staff",
        "roleDisplayName": "Staff Member",
        "status": "active"
      }
    ]
  }
}
```

Rules

- needs permission `core:member:read`
- role is `owner` or `branch_manager` or `staff`
- status is `active` or `inactive` or `suspended`
- 401 not logged in, 403 no permission or other restaurant

### 7.2 Invite Member

POST /restaurants/:restaurantId/members

Body

```json
{ "email": "omar@pizzapalace.com", "phone": "+201009999888", "name": "Omar Ali", "restaurantRole": "staff", "branchIds": [9] }
```

Response 200

```json
{
  "success": true,
  "data": {
    "message": "Member invited successfully",
    "member": {
      "id": 21,
      "userId": 31,
      "name": "Omar Ali",
      "email": "omar@pizzapalace.com",
      "phone": "+201009999888",
      "role": "staff",
      "status": "inactive",
      "branchIs": [9]
    }
  }
}
```

Rules

- needs permission `core:member:create`
- email must be new, name 3 to 50 chars
- restaurantRole is a role name, `owner` is not allowed
- branchIds optional and must be branches of this restaurant
- creates the user with no password and emails a 6 digit OTP, the invitee uses 1.5 Accept Invite
- new member status is inactive
- known typo: the response field is `branchIs`, it should be `branchIds`
- 400 bad input or `owner` role or unknown branch ids, 401 not logged in, 403 no permission or other restaurant, 404 role name not found

### 7.3 Update Member

PUT /restaurants/:restaurantId/members/:memberId

Body

```json
{ "restaurantRole": "branch_manager", "status": "active", "branchIds": [9, 10] }
```

Response 200

```json
{
  "success": true,
  "data": {
    "message": "Member updated successfully",
    "data": {
      "id": 21,
      "userId": 31,
      "restaurantId": 4,
      "roleId": 2,
      "status": "active",
      "createdAt": "2026-09-26T10:00:00.000Z",
      "updatedAt": "2026-09-26T10:00:00.000Z"
    }
  }
}
```

Rules

- needs permission `core:member:update`
- all fields optional, send only what changes
- restaurantRole is a role name, `owner` is not allowed
- status is `active` or `inactive` or `suspended`
- branchIds replaces the member branches when the array is not empty
- response returns the member record only, no name or email
- 400 bad input or `owner` role or unknown branch ids, 401 not logged in, 403 no permission or other restaurant, 404 member or role not found

### 7.4 Remove Member

DELETE /restaurants/:restaurantId/members/:memberId

Body
none

Response 200

```json
{ "success": true, "data": { "message": "Restaurant member deleted successfully" } }
```

Rules

- needs permission `core:member:delete`
- 401 not logged in, 403 no permission or other restaurant, 404 member not found

---

## 8. Health

### 8.1 Health Check

GET /api/health

Body
none

Response 200

```text
OK
```

Rules

- no login needed, plain text answer
- 200 `OK` when the database answers, 500 `DB Down` when it does not
