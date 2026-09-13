import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ProductModal } from "./product-modal";

const mockCreateCategory = vi.hoisted(() => vi.fn());
const mockCreateProduct = vi.hoisted(() => vi.fn());

vi.mock("../../src/actions/category", () => ({
  createCategory: mockCreateCategory,
}));
vi.mock("../../src/actions/product", () => ({
  createProductWithSkus: mockCreateProduct,
}));

describe("ProductModal category combobox", () => {
  it("permite cadastrar e selecionar uma categoria inline", async () => {
    mockCreateCategory.mockResolvedValue({ id: "cat-2", name: "Acessórios" });

    render(
      <ProductModal
        isOpen
        onClose={vi.fn()}
        categories={[{ id: "cat-1", name: "Vestuário" }]}
      />,
    );

    fireEvent.click(screen.getByTestId("category-combobox"));
    fireEvent.change(screen.getByTestId("category-combobox-input"), {
      target: { value: "Acessórios" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Cadastrar "Acessórios"/i }));

    await waitFor(() => {
      expect(mockCreateCategory).toHaveBeenCalledWith("Acessórios");
      expect(screen.getByTestId("category-combobox")).toHaveTextContent("Acessórios");
      expect(screen.getByRole("status")).toHaveTextContent("Categoria \"Acessórios\" criada.");
    });
  });
});
