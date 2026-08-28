import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { authorizeCredentials } from "./auth-credentials"
import { authConfig } from "./auth.config"

export { authorizeCredentials } from "./auth-credentials"

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Senha", type: "password" },
      },
      authorize: (credentials) => authorizeCredentials({
        email: typeof credentials?.email === "string" ? credentials.email : undefined,
        password: typeof credentials?.password === "string" ? credentials.password : undefined,
      }),
    }),
  ],
})