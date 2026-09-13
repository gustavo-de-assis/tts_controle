import { beforeEach, describe, expect, it, vi } from "vitest";
import { createCategory, deleteCategory, updateCategory } from "./category";

const mockAuth = vi.hoisted(() => vi.fn());
const mockCategoryCreate = vi.hoisted(() => vi.fn());
const mockCategoryFindFirst = vi.hoisted(() => vi.fn());
const mockCategoryFindUnique = vi.hoisted(() => vi.fn());
const mockCategoryUpdate = vi.hoisted(() => vi.fn());

vi.mock("../auth", () => ({ auth: mockAuth }));
vi.mock("../lib/prisma", () => ({
  prisma: {
    category: {
      create: mockCategoryCreate,
      findFirst: mockCategoryFindFirst,
      findUnique: mockCategoryFindUnique,
      update: mockCategoryUpdate,
    },
  },
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

describe("category actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    mockCategoryFindFirst.mockResolvedValue(null);
    mockCategoryCreate.mockResolvedValue({ id: "cat-new", name: "Acessórios" });
    mockCategoryUpdate.mockResolvedValue({ id: "cat-1", name: "Vestuário" });
  });

  it("cria uma categoria normalizando espaços e exigindo autenticação", async () => {
    const result = await createCategory("  Acessórios  ");

    expect(mockAuth).toHaveBeenCalledOnce();
    expect(mockCategoryCreate).toHaveBeenCalledWith({
      data: { name: "Acessórios" },
      select: { id: true, name: true },
    });
    expect(result).toEqual({ id: "cat-new", name: "Acessórios" });
  });

  it("rejeita nomes duplicados sem diferenciar maiúsculas", async () => {
    mockCategoryFindFirst.mockResolvedValue({ id: "cat-old", name: "acessórios" });

    await expect(createCategory("Acessórios")).rejects.toThrow("Já existe uma categoria");
    expect(mockCategoryCreate).not.toHaveBeenCalled();
    expect(mockCategoryFindFirst).toHaveBeenCalledWith({
      where: { name: { equals: "Acessórios", mode: "insensitive" } },
    });
  });

  it("renomeia a categoria e impede duplicidade", async () => {
    const result = await updateCategory("cat-1", " Vestuário ");

    expect(mockCategoryUpdate).toHaveBeenCalledWith({
      where: { id: "cat-1" },
      data: { name: "Vestuário" },
      select: { id: true, name: true },
    });
    expect(result.name).toBe("Vestuário");
  });

  it("não exclui categorias que possuem produtos", async () => {
    mockCategoryFindUnique.mockResolvedValue({ _count: { products: 2 } });

    await expect(deleteCategory("cat-1")).rejects.toThrow("possui produtos");
    expect(mockCategoryUpdate).not.toHaveBeenCalled();
  });
});
