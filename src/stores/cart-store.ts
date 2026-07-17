import type { components } from "@/types/schemas-payment";
import { create } from "zustand";

type PlanResponse = components["schemas"]["PlanResponse"];

type CartState = {
  items: PlanResponse[];
  addPlan: (plan: PlanResponse) => void;
  removePlan: (code: string) => void;
  clearCart: () => void;
  totalAmount: () => number;
  itemCount: () => number;
  hasPlan: (code: string) => boolean;
};

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  addPlan: (plan) => {
    if (!plan.code || get().items.some((item) => item.code === plan.code)) {
      return;
    }
    set((state) => ({ items: [...state.items, plan] }));
  },
  removePlan: (code) => {
    set((state) => ({
      items: state.items.filter((item) => item.code !== code),
    }));
  },
  clearCart: () => set({ items: [] }),
  totalAmount: () =>
    get().items.reduce((sum, item) => sum + (item.price ?? 0), 0),
  itemCount: () => get().items.length,
  hasPlan: (code) => get().items.some((item) => item.code === code),
}));
