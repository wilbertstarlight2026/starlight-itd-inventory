import { create } from 'zustand';
import type { Item, Category, Department, Location } from '@starlight/shared';

interface InventoryState {
  items: Item[];
  categories: Category[];
  departments: Department[];
  locations: Location[];
  isLoading: boolean;
  lastSyncAt: string | null;
  setItems: (items: Item[]) => void;
  upsertItem: (item: Item) => void;
  removeItem: (id: string) => void;
  setCategories: (categories: Category[]) => void;
  setDepartments: (departments: Department[]) => void;
  setLocations: (locations: Location[]) => void;
  setLoading: (loading: boolean) => void;
  setLastSyncAt: (time: string) => void;
}

export const useInventoryStore = create<InventoryState>((set) => ({
  items: [],
  categories: [],
  departments: [],
  locations: [],
  isLoading: false,
  lastSyncAt: null,

  setItems: (items) => set({ items }),

  upsertItem: (item) =>
    set((state) => {
      const existing = state.items.findIndex((i) => i.id === item.id);
      const newItems = [...state.items];
      if (existing >= 0) {
        newItems[existing] = item;
      } else {
        newItems.unshift(item);
      }
      return { items: newItems };
    }),

  removeItem: (id) =>
    set((state) => ({ items: state.items.filter((i) => i.id !== id) })),

  setCategories: (categories) => set({ categories }),
  setDepartments: (departments) => set({ departments }),
  setLocations: (locations) => set({ locations }),
  setLoading: (isLoading) => set({ isLoading }),
  setLastSyncAt: (lastSyncAt) => set({ lastSyncAt }),
}));
