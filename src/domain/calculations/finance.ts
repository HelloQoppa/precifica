import Decimal from 'decimal.js';
import type { AppPersistedStorage, CatalogProduct, CompanySettings } from '../../types';
import { simulationMonth } from '../../lib/dates';
Decimal.set({ precision: 32, rounding: Decimal.ROUND_HALF_UP });
const sum = (values: Decimal.Value[]) => values.reduce<Decimal>((a, b) => a.plus(b), new Decimal(0));
const money = (v: Decimal) => v.toDecimalPlaces(2).toNumber();
export function calculateGoals(settings: CompanySettings) {
  const fixed = sum(settings.fixedCosts.map(c => c.amount));
  const reserve = fixed.times(settings.emergencyReservePct);
  return { fixed: money(fixed), reserve: money(reserve), ideal: money(fixed.plus(reserve).plus(settings.proLaboreTarget)) };
}
export function calculateProduct(product: CatalogProduct, price = product.practicedPrice) {
  const cost = sum(product.ingredients.map(i => i.unitCost));
  const divisor = new Decimal(1).minus(product.taxRatePct).minus(product.targetMarginPct);
  if (divisor.lte(0)) throw new Error('Impostos e margem devem somar menos de 100%.');
  const contribution = new Decimal(price).times(new Decimal(1).minus(product.taxRatePct)).minus(cost);
  const floor = product.taxRatePct === 1 ? null : cost.div(new Decimal(1).minus(product.taxRatePct));
  return { cost: money(cost), suggested: money(cost.div(divisor)), contribution: contribution.toDecimalPlaces(4).toNumber(), margin: price > 0 ? contribution.div(price).toNumber() : 0,
    maxDiscount: price > 0 && floor ? Decimal.max(0, Decimal.min(1, new Decimal(1).minus(floor.div(price)))).toNumber() : 0 };
}
export function calculateUnits(target: number, contribution: number) {
  return contribution > 0 ? new Decimal(target).div(contribution).ceil().toNumber() : null;
}
export function calculateBatch(product: CatalogProduct, quantity: number, discount: number) {
  const unitPrice = money(new Decimal(product.practicedPrice).times(new Decimal(1).minus(discount)));
  const metrics = calculateProduct(product, unitPrice);
  return { ...metrics, unitPrice, revenue: money(new Decimal(unitPrice).times(quantity)), contributionTotal: money(new Decimal(metrics.contribution).times(quantity)) };
}
export function calculateBalance(state: AppPersistedStorage, month: string) {
  const rows = state.products.map(product => {
    const orders = state.simulations.filter(s => s.sendToBalance && s.productId === product.id && simulationMonth(s.simulatedAt) === month);
    const quantity = orders.reduce((a, o) => a + o.quantity, 0);
    const revenue = sum(orders.map(o => new Decimal(o.appliedUnitPrice).times(o.quantity)));
    const costs = new Decimal(calculateProduct(product).cost).times(quantity);
    const taxes = revenue.times(product.taxRatePct);
    return { id: product.id, name: product.name, quantity, weightedPrice: quantity ? money(revenue.div(quantity)) : 0, revenue: money(revenue), costs: money(costs), taxes: money(taxes), contribution: money(revenue.minus(costs).minus(taxes)) };
  }).filter(r => r.quantity > 0);
  const revenue = money(sum(rows.map(r => r.revenue)));
  const costs = money(sum(rows.map(r => r.costs)));
  const taxes = money(sum(rows.map(r => r.taxes)));
  const contribution = money(new Decimal(revenue).minus(costs).minus(taxes));
  const goals = calculateGoals(state.settings);
  return { rows, revenue, costs, taxes, contribution, goals, result: money(new Decimal(contribution).minus(goals.fixed)), afterGoals: money(new Decimal(contribution).minus(goals.ideal)) };
}
