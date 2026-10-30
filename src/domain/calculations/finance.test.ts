import { describe, expect, it } from 'vitest';
import { calculateBalance, calculateBatch, calculateGoals, calculateProduct, calculateUnits } from './finance';
import { createSeedData } from '../../lib/seedData';
import { productSchema, storageSchema } from '../validators/schemas';
import { simulationMonth } from '../../lib/dates';
describe('motor financeiro', () => {
  it('soma custos, calcula divisor e contribuição com precisão decimal', () => {
    const p = createSeedData().products[0];
    expect(calculateProduct(p)).toMatchObject({ cost: 24.2, suggested: 42.46, contribution: 40.108 });
    p.ingredients = [{ id: 'a', name: 'A', unitCost: 0.1 }, { id: 'b', name: 'B', unitCost: 0.2 }];
    expect(calculateProduct(p).cost).toBe(0.3);
  });
  it('calcula metas sem aplicar reserva sobre pró-labore', () => {
    expect(calculateGoals(createSeedData().settings)).toEqual({ fixed: 2350, reserve: 235, ideal: 6085 });
    expect(calculateUnits(2350, 40.108)).toBe(59);
    expect(calculateUnits(2350, 0)).toBeNull();
    expect(calculateUnits(2350, -1)).toBeNull();
  });
  it('aplica desconto em centavos antes de multiplicar o lote', () => {
    const p = createSeedData().products[0];
    expect(calculateBatch(p, 100, 0.12)).toMatchObject({ unitPrice: 61.51, revenue: 6151, contributionTotal: 3238.92 });
    expect(calculateBatch(p, 100, 1).contributionTotal).toBe(-2420);
    expect(calculateBatch(p, 100, 0.7).contribution).toBeLessThan(0);
    expect(calculateProduct(p).maxDiscount).toBeCloseTo(0.623685, 5);
  });
  it('consolida apenas pedidos incluídos do mês e preserva preço negociado', () => {
    const state = createSeedData(); const month = simulationMonth(state.simulations[0].simulatedAt);
    expect(calculateBalance(state, month)).toMatchObject({ revenue: 6151, costs: 2420, taxes: 492.08, contribution: 3238.92, result: 888.92, afterGoals: -2846.08 });
    state.products[0].practicedPrice = 100;
    expect(calculateBalance(state, month).revenue).toBe(6151);
    state.products[0].ingredients[0].unitCost = 20;
    expect(calculateBalance(state, month).costs).toBe(2570);
    state.simulations[0].sendToBalance = false;
    expect(calculateBalance(state, month).revenue).toBe(0);
    expect(calculateBalance(state, '2000-01').rows).toHaveLength(0);
  });
  it('rejeita divisor inválido, dados negativos e referências órfãs', () => {
    const state = createSeedData();
    expect(productSchema.safeParse({ ...state.products[0], taxRatePct: 0.7, targetMarginPct: 0.3 }).success).toBe(false);
    expect(() => calculateProduct({ ...state.products[0], taxRatePct: 0.7, targetMarginPct: 0.3 })).toThrow();
    state.settings.proLaboreTarget = -10;
    expect(storageSchema.safeParse(state).success).toBe(false);
    const orphan = createSeedData(); orphan.products = [];
    expect(storageSchema.safeParse(orphan).success).toBe(false);
  });
  it('atribui pedidos próximos da virada ao mês de São Paulo', () => {
    const state = createSeedData();
    state.simulations[0].simulatedAt = '2026-11-01T01:30:00.000Z';
    expect(simulationMonth(state.simulations[0].simulatedAt)).toBe('2026-10');
    expect(calculateBalance(state, '2026-10').revenue).toBe(6151);
    expect(calculateBalance(state, '2026-11').revenue).toBe(0);
  });
});
