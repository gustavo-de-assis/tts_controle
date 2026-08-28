import { beforeEach, describe, expect, it, vi } from 'vitest'
import { authorizeCredentials } from './auth-credentials'

const mockUserFindUnique = vi.hoisted(() => vi.fn())
const mockCompare = vi.hoisted(() => vi.fn())

vi.mock('./lib/prisma', () => ({
  prisma: { user: { findUnique: mockUserFindUnique } },
}))

vi.mock('bcryptjs', () => ({
  compare: mockCompare,
}))

describe('authorizeCredentials', () => {
  beforeEach(() => vi.clearAllMocks())

  it('deve autenticar email normalizado sem expor a senha', async () => {
    mockUserFindUnique.mockResolvedValue({
      id: 'user-1',
      name: 'Administrador',
      email: 'admin@example.com',
      password: 'hash-secreto',
      role: 'ADMIN',
    })
    mockCompare.mockResolvedValue(true)

    const user = await authorizeCredentials({
      email: ' ADMIN@EXAMPLE.COM ',
      password: 'senha-segura',
    })

    expect(mockUserFindUnique).toHaveBeenCalledWith({ where: { email: 'admin@example.com' } })
    expect(mockCompare).toHaveBeenCalledWith('senha-segura', 'hash-secreto')
    expect(user).toEqual({ id: 'user-1', name: 'Administrador', email: 'admin@example.com', role: 'ADMIN' })
  })

  it('deve rejeitar usuário inexistente ou senha inválida', async () => {
    mockUserFindUnique.mockResolvedValue(null)
    await expect(authorizeCredentials({ email: 'missing@example.com', password: 'senha' })).resolves.toBeNull()

    mockUserFindUnique.mockResolvedValue({ password: 'hash' })
    mockCompare.mockResolvedValue(false)
    await expect(authorizeCredentials({ email: 'admin@example.com', password: 'errada' })).resolves.toBeNull()
  })
})
