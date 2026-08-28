import { compare } from "bcryptjs"
import { prisma } from "./lib/prisma"

export interface AuthenticatedUser {
  id: string
  name: string
  email: string
  role: string
}

export interface CredentialsInput {
  email?: string
  password?: string
}

export async function authorizeCredentials(
  credentials: CredentialsInput
): Promise<AuthenticatedUser | null> {
  const email = credentials.email?.trim().toLowerCase()
  const password = credentials.password

  if (!email || !password) return null

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user || !(await compare(password, user.password))) return null

  return { id: user.id, name: user.name, email: user.email, role: user.role }
}