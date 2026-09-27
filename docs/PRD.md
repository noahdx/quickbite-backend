# QuickBite — Product Requirements Document

> **Food Delivery Platform — Core Backend**

---

## 1. Product Overview

**Product Name**

QuickBite

**Vision**

Build a clear, safe platform where customers find restaurants, and each restaurant manages its own branches, menu, prices and team, with strong rules about who is allowed to change what.

**What the backend does today**

- Accounts: register, login, password reset by email code, team invitation
- Restaurants: create, update, status
- Branches: locations, opening hours, delivery radius, currency
- Menus: products, categories, price, stock, availability
- Customer delivery addresses
- Restaurant team with roles and branch access
- Platform services: cache, email, error handling, health check

---

## 2. User Types & Roles

### 2.1 Customer

- Register and login
- Update own profile
- Save delivery addresses
- Set one default address
- Find restaurants and branches near them
- Browse menus and prices
- No access to restaurant or team data

### 2.2 Restaurant (RBAC REQUIRED)

**Roles inside a restaurant**

**1️⃣ Restaurant Owner**

- Manage restaurant profile
- Create branches and change branch settings
- Manage menu, pricing, stock
- Invite staff, change roles, remove staff

**2️⃣ Branch Manager**

- Update the branches they have access to
- Manage menu, pricing, stock
- View the team list
- Cannot create branches or manage the team

**3️⃣ Restaurant Staff**

- View the product list
- View the team list
- Read only, cannot change anything

> RBAC is enforced per restaurant, not globally. A user who is owner in restaurant A has no access to restaurant B.

**How a request is checked**

- Is the user logged in?
- Does the user belong to this restaurant or branch?
- Does the role allow this action?

All three must pass. A platform admin skips all three.

### 2.3 Platform Admin

- Manage restaurants
- Create a restaurant with its owner account
- Change the status of any restaurant
- Sees everything, no permission limits

---

## 3. Core Flows

**Owner signs up**

```
Register → Create user → Create restaurant → Create owner member → Login
```

**Admin creates a restaurant**

```
Create restaurant request → Check owner email is new → Create owner user
→ Create restaurant → Create owner member
```

**Owner invites a staff member**

```
Invite request → Check role exists → Check email is new → Create user with no password
→ Create member (inactive) → Attach branches → Create 6 digit code → Send email
```

**New member accepts the invitation**

```
Enter email + code + new password → Check the code → Save the password
→ Activate the member → Login
```

**Customer resets the password**

```
Enter email → Send 6 digit code → Enter email + code + new password
→ Check the code → Save the password → Login again
```

**Owner creates a branch**

```
Create branch request → Save branch (inactive, takes orders, no commission)
→ Give the creator access → Owner switches the branch on
```

**Owner builds the menu**

```
Create product request → Create the category if the name is new → Save the product
→ System creates one row per branch with price 0 and stock 0
→ Owner sets the real price per branch
```

**Customer finds a restaurant**

```
Customer location → Find nearby branches → System checks each branch is active
and the restaurant is active and the location is inside the delivery radius
→ Customer opens a branch → Menu and categories are shown
```

**Customer manages addresses**

```
Add address → If it is the default, clear the default on the others → Save
```

---

## 4. Restaurants & Branches

**Restaurant**

- Has a name, a logo, a primary country and a status
- Status is one of: active, suspended, disabled, pending
- Created by the admin → starts active
- Created by an owner signup → starts pending
- A restaurant that is not active never shows up in nearby search

**Branch**

- A branch is one real shop of a restaurant
- Has a label, an address, a map point, opening hours, closing hours
- Has a delivery radius in kilometres
- Has a currency, either EGP or SAR
- Has a country code, for example EG
- New branch starts with: not active, takes orders, no commission
- The creator of a branch gets access to it
- A branch has two separate switches: visible or hidden, and takes orders or not

---

## 5. Menu, Prices & Commission

**Product**

- Belongs to one restaurant
- Has a name, a description, an image
- Can belong to a category
- A category belongs to one restaurant only, names are not shared
- A new category name creates the category automatically

**Price, stock and availability**

- They belong to one branch, not to the product
- The same product can have a different price in every branch
- The price is a whole number in the currency of the branch
- The stock cannot be less than zero
- A new product starts with price 0, stock 0, not available in every existing branch

**Commission**

- Every branch has a commission
- It is a percentage from 0 to 100
- A new branch starts with commission 0
- The branch commission is changed in a separate call from the branch details

---

## 6. Team & Invitations

- A member belongs to one restaurant
- A member has a role: owner, branch manager or staff
- A member has a status: active, inactive or suspended
- A member can be given access to many branches
- Only the owner can invite, change or remove a member
- The owner role is created by the system, never by an invite
- An invited member has no password until they accept
- A new member is inactive until they accept the invitation
- Every branch given to a member must belong to the same restaurant
- Removing a member does not remove the user account

---

## 7. Customer Addresses

- A customer can save many addresses
- Only one address can be the default
- Setting a new default address clears the old one
- An address has a label, country, city, street
- Optional building and apartment number
- An address type: home, office or public place
- An address needs a map point, latitude and longitude
- A customer only sees and changes their own addresses
- Asking for the address of another customer returns not found

---

## 8. Functional Requirements

**Customer**

- Account registration and login
- Profile read and update
- Address create, read, update, delete
- Restaurant list and details
- Nearby branch search
- Menu and category browsing

**Restaurant**

- Restaurant create, read, update, status change
- Branch create, read, update, status change
- Nearby branch search
- Product create, read, update
- Menu read per branch
- Category read

**Team**

- Member list
- Member invite
- Member update
- Member remove

**Platform**

- Health check
- Email delivery for password reset and invitation
- Cache for browsing endpoints
- Trace id on every answer

---

## 9. Non-Functional Requirements

**Availability**

- The health endpoint reports if the server and the database are up

**Latency**

- Browsing a restaurant or a menu: less than 1 second
- Nearby search: less than 1 second
- Any write: less than 1 second

**Consistency**

- Strong consistency for accounts, restaurants, branches, prices, stock and team
- Browsing endpoints may use the cache, so a list can be up to one hour old
- A write always reads the real value, never the cache

**Security**

- Passwords are stored as hashes, never as plain text
- Email codes are stored as hashes
- Tokens are stored in cookies that JavaScript cannot read
- Access token lives 1 hour, refresh token lives 7 days
- Restaurant ownership is checked on every request
- Branch access is checked on every branch request
- Every field is validated before it is saved
- The password reset answer never reveals if an email exists

**Reliability**

- Multi step writes run in one database transaction
- If any step fails, nothing is saved
- Duplicate requests are protected with an idempotency key

---

## 10. Data & Storage

**Tables**

- `users` → all accounts
- `password_resets` → email codes with expiry and used flag
- `customer_addresses` → delivery addresses
- `restaurants` → restaurant data and status
- `restaurant_branches` → branch data, hours, radius, currency, commission
- `product_categories` → menu categories per restaurant
- `products` → menu items
- `product_branch_details` → price, stock, availability per branch
- `roles` → the three restaurant roles
- `permissions` → the allowed actions
- `role_permissions` → what each role can do
- `restaurant_members` → who works where, with which role
- `member_branches` → which branches a member manages

**Data retention**

- Accounts, restaurants, menus and orders of the team are kept long term
- Removed products and removed members are soft deleted, the row is kept for history
- Logs are kept for 30 days
- Cache entries expire after 1 hour

---

## 11. Architecture Assumptions

- The backend is stateless, it can run in more than one place
- Sessions live in tokens, not on the server
- Cache and email are reached through providers, not directly
- One database transaction per business operation
- PostGIS answers the geographic queries
- The same city and country rules apply for every branch

---

## 12. Constraints & Risks

- A branch without a map point cannot be found nearby
- A restaurant without an active branch cannot be found by customers
- A product without a branch price shows as unavailable
- Too many roles with too many permissions makes the rules hard to follow
- Cached lists are not cleared after a change, so a customer can see old data for one hour
- One email code per request only, a lost code needs a new request
- All prices are whole numbers, no coins or fractions

---

## 13. Success Criteria

- An owner can sign up and land inside their own restaurant
- An admin can create a restaurant and the owner can login right away
- A new member can accept the invitation and login with a new password
- An owner can create a branch and switch it on
- Nearby search returns only branches that deliver to the customer
- The same product shows a different price in two branches
- Only the owner can invite or remove a member
- A member can only change the branches assigned to them
- A user of restaurant A cannot reach restaurant B
- A customer can save many addresses with one default
- A failure in a multi step write leaves nothing half saved

---

## 14. Out of scope

- Recommendation systems
- Loyalty programs
- AI based delivery optimization
- Reviews and ratings
