import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Missing credentials");
        }

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

        if (!user || !user.passwordHash) {
          throw new Error("Invalid credentials");
        }

        const isValid = await bcrypt.compare(credentials.password, user.passwordHash);

        if (!isValid) {
          throw new Error("Invalid credentials");
        }

        // Flatten permissions for easy access in JWT
        const permissions = Array.from(new Set(
          user.roles.flatMap(ur => 
            ur.role.rolePermissions.map(rp => rp.permission.code)
          )
        ));

        const roles = user.roles.map(ur => ur.role.code);

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
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.roles = user.roles;
        token.permissions = user.permissions;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
        session.user.roles = token.roles;
        session.user.permissions = token.permissions;
      }
      return session;
    }
  },
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: '/login',
  }
});





// {
//   "id": "user-uuid-1234",
//   "name": "John Doe",
//   "email": "john@dynamicdocs.com",
//   "passwordHash": "$2a$10$xyz...",
//   "createdAt": "2026-06-26T10:00:00.000Z",
//   "updatedAt": "2026-06-26T10:00:00.000Z",
//   "isVerified": true,
  
//   // This array comes from `include: { roles: ... }`
//   "roles": [
//     {
//       "id": "user-role-mapping-uuid",
//       "userId": "user-uuid-1234",
//       "roleId": "role-uuid-abcd",
      
//       // This object comes from `include: { role: ... }`
//       "role": {
//         "id": "role-uuid-abcd",
//         "name": "System Administrator",
//         "code": "ADMIN",
        
//         // This array comes from `include: { rolePermissions: ... }`
//         "rolePermissions": [
//           {
//             "id": "mapping-uuid-1",
//             "roleId": "role-uuid-abcd",
//             "permissionId": "perm-uuid-1",
            
//             // This object comes from `include: { permission: true }`
//             "permission": {
//               "id": "perm-uuid-1",
//               "code": "CREATE_USER",
//               "name": "Create Users",
//               "module": "USERS"
//             }
//           },
//           {
//             "id": "mapping-uuid-2",
//             "roleId": "role-uuid-abcd",
//             "permissionId": "perm-uuid-2",
            
//             "permission": {
//               "id": "perm-uuid-2",
//               "code": "DELETE_DOC",
//               "name": "Delete Documents",
//               "module": "DOCUMENTS"
//             }
//           }
//           // ... more permissions ...
//         ]
//       }
//     }
//   ]
// }
