import { create } from 'zustand';
import { getDb } from '@/lib/db/client';
import {
  getAllCategories,
  getCategoryById,
  insertCategory,
  updateCategory,
  deleteCategory,
  isCategoryReferenced,
} from '@/lib/db/queries/categories';
import type { Category } from '@/types';

interface CategoryState {
  categories: Category[];

  load: () => Promise<void>;
  add: (name: string, color: string, icon?: string) => Promise<void>;
  update: (id: number, data: { name?: string; color?: string; icon?: string }) => Promise<void>;
  remove: (id: number) => Promise<{ success: boolean; reason?: string }>;
  getById: (id: number) => Category | undefined;
}

export const useCategoryStore = create<CategoryState>((set, get) => ({
  categories: [],

  load: async () => {
    const db = await getDb();
    const categories = await getAllCategories(db);
    set({ categories });
  },

  add: async (name, color, icon) => {
    const db = await getDb();
    await insertCategory(db, { name, color, icon });
    const categories = await getAllCategories(db);
    set({ categories });
  },

  update: async (id, data) => {
    const db = await getDb();
    await updateCategory(db, id, data);
    const categories = await getAllCategories(db);
    set({ categories });
  },

  remove: async (id) => {
    const db = await getDb();
    const referenced = await isCategoryReferenced(db, id);
    if (referenced) {
      return { success: false, reason: 'Category is used by existing expenses' };
    }
    const cat = await getCategoryById(db, id);
    if (cat?.isDefault) {
      return { success: false, reason: 'Cannot delete a default category' };
    }
    await deleteCategory(db, id);
    const categories = await getAllCategories(db);
    set({ categories });
    return { success: true };
  },

  getById: (id) => get().categories.find((c) => c.id === id),
}));
