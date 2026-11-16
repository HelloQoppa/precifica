"use client";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type {
  AppPersistedStorage,
  CatalogProduct,
  CompanySettings,
  BatchSimulationOrder,
  ProductTax,
} from "../types";
import {
  storageSchema,
  productSchema,
  productTaxSchema,
  settingsSchema,
  simulationSchema,
} from "../domain/validators/schemas";
import { browserStorage, STORAGE_KEY, storageStatus } from "../lib/storage";
import { createSeedData } from "../lib/seedData";
interface Store extends AppPersistedStorage {
  _hasHydrated: boolean;
  notice: string;
  saveProductTax: (tax: ProductTax) => void;
  deleteProductTax: (id: string) => void;
  saveProduct: (p: CatalogProduct) => void;
  deleteProduct: (id: string) => void;
  saveSettings: (s: CompanySettings) => void;
  addSimulation: (s: BatchSimulationOrder) => void;
  toggleSimulation: (id: string) => void;
  deleteSimulation: (id: string) => void;
  reset: () => void;
}
export const useAppStore = create<Store>()(
  persist(
    (set) => ({
      ...createSeedData(),
      _hasHydrated: false,
      notice: "",
      saveProductTax: (tax) => {
        const parsed = productTaxSchema.parse(tax);
        set((s) => ({
          productTaxes: s.productTaxes.some((t) => t.id === parsed.id)
            ? s.productTaxes.map((t) => (t.id === parsed.id ? parsed : t))
            : [...s.productTaxes, parsed],
        }));
      },
      deleteProductTax: (id) =>
        set((s) => ({
          productTaxes: s.productTaxes.filter((t) => t.id !== id),
          products: s.products.map((p) =>
            p.productTaxId === id ? { ...p, productTaxId: undefined } : p,
          ),
        })),
      saveProduct: (p) => {
        const product = productSchema.parse(p);
        set((s) => ({
          products: s.products.some((x) => x.id === p.id)
            ? s.products.map((x) => (x.id === p.id ? product : x))
            : [...s.products, product],
        }));
      },
      deleteProduct: (id) =>
        set((s) => ({
          products: s.products.filter((p) => p.id !== id),
          simulations: s.simulations.filter((o) => o.productId !== id),
        })),
      saveSettings: (s) => set({ settings: settingsSchema.parse(s) }),
      addSimulation: (order) =>
        set((s) => {
          if (!s.products.some((p) => p.id === order.productId))
            throw new Error("Produto não encontrado.");
          return {
            simulations: [...s.simulations, simulationSchema.parse(order)],
          };
        }),
      toggleSimulation: (id) =>
        set((s) => ({
          simulations: s.simulations.map((o) =>
            o.id === id ? { ...o, sendToBalance: !o.sendToBalance } : o,
          ),
        })),
      deleteSimulation: (id) =>
        set((s) => ({ simulations: s.simulations.filter((o) => o.id !== id) })),
      reset: () =>
        set({
          ...createSeedData(),
          notice: "Dados de demonstração restaurados.",
        }),
    }),
    {
      name: STORAGE_KEY,
      version: 1,
      skipHydration: true,
      storage: createJSONStorage(() => ({
        ...browserStorage,
        async getItem(key) {
          const raw = await browserStorage.getItem(key);
          if (!raw) return null;
          try {
            const parsed = JSON.parse(raw);
            if (parsed.version !== 1) throw new Error("Versão não suportada");
            parsed.state = storageSchema.parse(parsed.state);
            return JSON.stringify(parsed);
          } catch {
            await browserStorage.setItem(
              `${key}_corrupted_backup_${Date.now()}`,
              raw,
            );
            storageStatus.message =
              "Dados locais inválidos: uma cópia foi preservada e os exemplos foram recuperados.";
            return null;
          }
        },
      })),
      partialize: (s) => ({
        version: s.version,
        productTaxes: s.productTaxes,
        settings: s.settings,
        products: s.products,
        simulations: s.simulations,
      }),
      onRehydrateStorage: () => () => {
        useAppStore.setState({
          _hasHydrated: true,
          notice: storageStatus.message,
        });
      },
    },
  ),
);
