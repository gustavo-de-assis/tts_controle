import { describe, expect, it, vi } from "vitest"
import { requireUser } from "./auth-guard"

const mockAuth = vi.hoisted(() => vi.fn())

vi.mock("../auth", () => ({ auth: mockAuth }))

describe("requireUser", () => {
  it("deve rejeitar chamadas sem sessão", async () => {
    mockAuth.mockResolvedValue(null)

    await expect(requireUser()).rejects.toThrow("Unauthorized")
  })

  it("deve retornar o usuário da sessão autenticada", async () => {
    const user = { id: "user-1", name: "Admin", email: "admin@example.com", role: "ADMIN" }
    mockAuth.mockResolvedValue({ user })

    await expect(requireUser()).resolves.toEqual(user)
  })
})
