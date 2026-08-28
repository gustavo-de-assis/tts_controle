import type { NextAuthConfig } from "next-auth"

export const authConfig = {
  providers: [],
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  callbacks: {
    authorized({ auth }) {
      return Boolean(auth?.user)
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
      }
      return token
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
      }
      return session
    },
  },
} satisfies NextAuthConfig
