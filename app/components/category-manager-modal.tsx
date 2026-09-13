"use client";

import { useState } from "react";
import { Check, Pencil, Tag, Trash2, X } from "lucide-react";
import { deleteCategory, updateCategory } from "../../src/actions/category";
import type { CategoryItem } from "../../src/actions/category";

interface CategoryManagerModalProps {
  isOpen: boolean;
  categories: CategoryItem[];
  onClose: () => void;
  onCategoriesChange: (categories: CategoryItem[]) => void;
}

export function CategoryManagerModal({
  isOpen,
  categories,
  onClose,
  onCategoriesChange,
}: CategoryManagerModalProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const startEditing = (category: CategoryItem) => {
    setEditingId(category.id);
    setEditingName(category.name);
    setError("");
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditingName("");
  };

  const handleRename = async (id: string) => {
    setLoading(true);
    setError("");
    try {
      const updatedCategory = await updateCategory(id, editingName);
      onCategoriesChange(
        categories.map((category) =>
          category.id === id ? updatedCategory : category,
        ),
      );
      cancelEditing();
    } catch (renameError) {
      setError(renameError instanceof Error ? renameError.message : "Erro ao renomear categoria.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (category: CategoryItem) => {
    if (!window.confirm(`Excluir a categoria "${category.name}"?`)) return;

    setLoading(true);
    setError("");
    try {
      await deleteCategory(category.id);
      onCategoriesChange(categories.filter((item) => item.id !== category.id));
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Erro ao excluir categoria.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 pb-20 md:p-6 backdrop-blur-sm">
      <div className="w-full max-w-md max-h-[80vh] overflow-hidden rounded-2xl border border-slate-800 bg-[#131b2e] text-foreground shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <Tag className="h-5 w-5 text-primary" />
            Gerenciar Categorias
          </h2>
          <button type="button" onClick={onClose} aria-label="Fechar categorias" className="rounded-full p-2 text-muted-foreground hover:bg-slate-800 hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-[60vh] space-y-2 overflow-y-auto p-5">
          {error && <p className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">{error}</p>}
          {categories.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Nenhuma categoria cadastrada.</p>
          ) : (
            categories.map((category) => (
              <div key={category.id} className="flex items-center gap-2 rounded-xl border border-border bg-background/40 p-2">
                {editingId === category.id ? (
                  <>
                    <input
                      autoFocus
                      value={editingName}
                      onChange={(event) => setEditingName(event.target.value)}
                      className="min-w-0 flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      aria-label={`Novo nome de ${category.name}`}
                    />
                    <button type="button" disabled={loading} onClick={() => handleRename(category.id)} aria-label="Salvar categoria" className="rounded-lg p-2 text-emerald-400 hover:bg-emerald-400/10 disabled:opacity-50">
                      <Check className="h-4 w-4" />
                    </button>
                    <button type="button" disabled={loading} onClick={cancelEditing} aria-label="Cancelar edição" className="rounded-lg p-2 text-muted-foreground hover:bg-muted disabled:opacity-50">
                      <X className="h-4 w-4" />
                    </button>
                  </>
                ) : (
                  <>
                    <span className="min-w-0 flex-1 truncate px-2 text-sm font-medium">{category.name}</span>
                    <button type="button" disabled={loading} onClick={() => startEditing(category)} aria-label={`Renomear ${category.name}`} className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-50">
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button type="button" disabled={loading} onClick={() => handleDelete(category)} aria-label={`Excluir ${category.name}`} className="rounded-lg p-2 text-red-400 hover:bg-red-400/10 disabled:opacity-50">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </>
                )}
              </div>
            ))
          )}
        </div>

        <div className="border-t border-slate-800 px-5 py-4 text-right">
          <button type="button" onClick={onClose} className="rounded-lg border border-border px-4 py-2 text-sm text-foreground hover:bg-muted">Fechar</button>
        </div>
      </div>
    </div>
  );
}
