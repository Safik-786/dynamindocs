# NextAuth Authentication Flow (In-Depth)

This document provides a deep dive into how NextAuth v5 handles authentication in this application. It covers both the underlying API requests that NextAuth automatically executes in the background, and the specific database queries we run in `auth.js` to handle Role-Based Access Control (RBAC).

---

## The 4-Step NextAuth API Flow

When a user visits the login page and submits their credentials, NextAuth orchestrates a precise, highly secure sequence of API calls. You do not write these routes manually; NextAuth dynamically generates them under `/api/auth/*`.

### 1. `GET /api/auth/providers`
**When it happens:** As soon as the login page is loaded.
**What it does:** NextAuth queries this endpoint to determine which authentication methods are currently configured for the application. Based on our `auth.js` configuration, this endpoint responds with JSON indicating that the `Credentials` provider is active.
**Why it matters:** It tells the frontend how to render the login form and which authentication strategies are valid.

### 2. `GET /api/auth/csrf`
**When it happens:** Before the user hits the "Sign In" button.
**What it does:** NextAuth fetches a CSRF (Cross-Site Request Forgery) token.
**Why it matters:** 
> [!IMPORTANT]
> CSRF tokens are a critical security measure. Without this token, a hacker could build a fake website that tricks a user's browser into sending a malicious login or state-changing request to your server. By fetching a unique CSRF token first, NextAuth ensures that the incoming POST request is genuinely originating from *your* application's frontend.

### 3. `POST /api/auth/callback/credentials`
**When it happens:** The exact moment the user clicks "Sign In".
**What it does:** The frontend bundles the user's `email`, `password`, and the `CSRF token`, then POSTs them to this endpoint. 
**The Internal Process:**
When this endpoint is hit, NextAuth triggers the `authorize()` function inside our `auth.js` file:
1. **Verification:** It checks if the email and password are provided.
2. **Database Query:** It runs the deep Prisma `findUnique` query to fetch the user, their roles, and their permissions.
3. **Password Hashing:** It securely hashes the provided plain-text password using `bcrypt` and compares it against the scrambled hash stored in the database.
4. **Data Extraction:** It flattens the nested roles and permissions into simple arrays.
5. **JWT Creation:** If everything is valid, NextAuth encrypts the returned user object (ID, email, roles, permissions) into a secure, stateless JSON Web Token (JWT) cookie.

### 4. `GET /api/auth/session`
**When it happens:** Immediately after a successful login, and whenever a protected page is refreshed.
**What it does:** The frontend asks the server, *"Who is currently logged in?"*
**The Internal Process:**
NextAuth reads the encrypted JWT cookie sent by the browser. It decodes the token and passes the payload to the `session()` callback in `auth.js`. The callback formats the data (injecting the user ID, roles, and permissions) and sends it back to the frontend.
**Why it matters:** This is how your React components (like the `<ProtectedRoute>` or the Dashboard Header) know the user's identity and permissions, enabling them to render Admin-only links or redirect unauthorized users.

---

## The Database Query (RBAC Deep Dive)

During step 3 (`authorize()`), we run this massive Prisma query:

```javascript
const user = await prisma.user.findUnique({
  where: { email: credentials.email },
  include: {
    roles: {
      include: {
        role: {
          include: {
            rolePermissions: {
              include: {
                permission: true
              }
            }
          }
        }
      }
    }
  }
});
```

### Understanding the Data Structure

Because SQL databases use relational tables, we have a "Many-to-Many" architecture:
- **Users** can have many **Roles**.
- **Roles** can have many **Permissions**.

This requires intermediate "Mapping Tables" (`UserRole` and `RolePermission`). The deeply nested `include` statement traverses these mappings.

If we visualize the JSON object this query returns, it looks like this:

```json
{
  "id": "user-uuid-1234",
  "email": "admin@dynamicdocs.com",
  "passwordHash": "$2a$10$xyz...",
  
  "roles": [ // Array of UserRole mappings
    {
      "role": { // The actual Role object
        "name": "System Administrator",
        "code": "ADMIN",
        
        "rolePermissions": [ // Array of RolePermission mappings
          {
            "permission": { // The actual Permission object
              "code": "CREATE_USER",
              "module": "USERS"
            }
          },
          {
            "permission": {
              "code": "DELETE_DOC",
              "module": "DOCUMENTS"
            }
          }
        ]
      }
    }
  ]
}
```

### Flattening the Data

NextAuth's JWT and Session objects should be lightweight. We do not want to store that massive nested JSON object inside a browser cookie. 

Therefore, in `auth.js`, we flatten the data before returning it:

```javascript
// Digs through the nested arrays and extracts just the permission codes
const permissions = Array.from(new Set(
  user.roles.flatMap(ur => 
    ur.role.rolePermissions.map(rp => rp.permission.code)
  )
));

// Extracts just the role codes
const roles = user.roles.map(ur => ur.role.code);
```

By flattening the data, we turn the massive nested object into simple, lightweight arrays:
- `roles: ["ADMIN"]`
- `permissions: ["CREATE_USER", "DELETE_DOC"]`

This highly optimized data is what gets injected into the JWT and sent to the frontend `session`, making it extremely fast and easy for your React code to check `session.user.roles.includes("ADMIN")`.

---

## Line-by-Line Breakdown of `auth.js`

Here is exactly what every line of code in `src/lib/auth.js` is doing:

### 1. Imports
```javascript
import NextAuth from "next-auth"; // The main function that initializes the authentication system.
import CredentialsProvider from "next-auth/providers/credentials"; // Allows users to log in using an email and password.
import bcrypt from "bcryptjs"; // Cryptographic library to securely compare hashed passwords.
import { prisma } from "./prisma"; // Database ORM client to fetch users.
```

### 2. Initialization & Providers
```javascript
export const { handlers, signIn, signOut, auth } = NextAuth({
  // Exports tools for your app:
  // - handlers: Used in Next.js API Routes to intercept login/logout requests.
  // - signIn / signOut: Server-side functions to trigger login or logout.
  // - auth: A function to check if the user is currently logged in.

  providers: [
    CredentialsProvider({
      name: "Credentials", // The internal ID of this provider (used when calling signIn("credentials")).
      credentials: { // Defines the fields expected in the login form.
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
```

### 3. The `authorize` Function (The Core Security Check)
```javascript
      async authorize(credentials) {
        // 1. Ensure the user actually typed an email and password
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Missing credentials");
        }

        // 2. Fetch the user and all their deeply nested RBAC data from the database
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          include: { roles: { include: { role: { include: { rolePermissions: { include: { permission: true } } } } } } }
        });

        // 3. If no user exists with that email, or they don't have a password, deny access
        if (!user || !user.passwordHash) {
          throw new Error("Invalid credentials");
        }

        // 4. Securely compare the typed password against the hashed password in the DB
        const isValid = await bcrypt.compare(credentials.password, user.passwordHash);

        // 5. If the passwords don't match, deny access
        if (!isValid) {
          throw new Error("Invalid credentials");
        }

        // 6. Flatten the deeply nested permissions arrays into a simple, unique list of strings
        const permissions = Array.from(new Set(
          user.roles.flatMap(ur => ur.role.rolePermissions.map(rp => rp.permission.code))
        ));

        // 7. Flatten the roles into a simple array of strings
        const roles = user.roles.map(ur => ur.role.code);

        // 8. Return a safe User Object (NO PASSWORD INCLUDED!) back to NextAuth
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          roles,
          permissions
        };
      }
    })
  ],
```

### 4. JWT & Session Callbacks (Passing Data to the Frontend)
```javascript
  callbacks: {
    async jwt({ token, user }) {
      // Runs when the JWT is created or updated. 
      // If a user just logged in, inject their DB ID, roles, and permissions into the secure token.
      if (user) {
        token.id = user.id;
        token.roles = user.roles;
        token.permissions = user.permissions;
      }
      return token; // The token is then securely encrypted and stored as a browser cookie.
    },
    async session({ session, token }) {
      // Runs whenever the frontend asks "Who is logged in?" (via useSession() or auth()).
      // It takes the decrypted token data and exposes it to the frontend session object.
      if (token) {
        session.user.id = token.id;
        session.user.roles = token.roles;
        session.user.permissions = token.permissions;
      }
      return session;
    }
  },
```

### 5. Configuration Settings
```javascript
  session: {
    strategy: "jwt", // Tells NextAuth to use stateless, encrypted cookies instead of saving sessions in the DB.
  },
  pages: {
    signIn: '/login', // Tells NextAuth to redirect unauthorized users to your custom login page instead of the default ugly one.
  }
});
```
