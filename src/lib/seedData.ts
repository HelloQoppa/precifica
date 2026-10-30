import type { AppPersistedStorage } from '../types';
export function createSeedData(): AppPersistedStorage {
  const now = new Date().toISOString();
  return { version: 1, settings: { id: 'default_settings', fixedCosts: [
    { id: 'fix-1', name: 'Aluguel da Oficina', amount: 1500 }, { id: 'fix-2', name: 'Energia Elétrica', amount: 350 },
    { id: 'fix-3', name: 'Internet / Software', amount: 180 }, { id: 'fix-4', name: 'Contabilidade', amount: 320 },
  ], proLaboreTarget: 3500, emergencyReservePct: 0.1, updatedAt: now }, products: [
    { id: 'prod-camisa-streetwear', name: 'Camiseta Algodão Estonada (Silk 2 Cores)', taxRatePct: 0.08, targetMarginPct: 0.35, practicedPrice: 69.9, createdAt: now, updatedAt: now, ingredients: [
      { id: 'ing-1', name: 'Malha Algodão Penteado 30.1', unitCost: 18.5 }, { id: 'ing-2', name: 'Tinta Serigráfica e Emulsão', unitCost: 3.2 }, { id: 'ing-3', name: 'Etiqueta e Tag', unitCost: 1.1 }, { id: 'ing-4', name: 'Saco Plástico e Fita de Envio', unitCost: 1.4 },
    ] },
    { id: 'prod-caneca-ceramica', name: 'Caneca de Cerâmica Sublimada', taxRatePct: 0.06, targetMarginPct: 0.4, practicedPrice: 38, createdAt: now, updatedAt: now, ingredients: [
      { id: 'ing-5', name: 'Caneca Resinada Base', unitCost: 11 }, { id: 'ing-6', name: 'Papel e Tinta Sublimática', unitCost: 1.8 }, { id: 'ing-7', name: 'Caixinha Individual Kraft', unitCost: 2.2 },
    ] },
  ], simulations: [{ id: 'sim-lote-100-camisas', productId: 'prod-camisa-streetwear', quantity: 100, discountPct: 0.12, appliedUnitPrice: 61.51, sendToBalance: true, simulatedAt: now }] };
}
