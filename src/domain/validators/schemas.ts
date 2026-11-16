import { z } from 'zod';
const money = z.number().finite().min(0).max(1e10);
const name = z.string().trim().min(1, 'Informe um nome.').max(160);
const rate = z.number().finite().min(0).max(1);
export const ingredientSchema = z.object({ id: z.string().min(1), name, unitCost: money });
export const productTaxSchema = z.object({ id: z.string().min(1), name, ratePct: rate });
export const productSchema = z.object({
  id: z.string().min(1), name, ingredients: z.array(ingredientSchema).min(1),
  taxRatePct: rate, productTaxId: z.string().min(1).optional(), targetMarginPct: rate, practicedPrice: money,
  createdAt: z.string().datetime(), updatedAt: z.string().datetime(),
}).refine(p => p.taxRatePct + p.targetMarginPct < 1, { message: 'Impostos e margem devem somar menos de 100%.', path: ['targetMarginPct'] });
export const settingsSchema = z.object({ id: z.string(), fixedCosts: z.array(z.object({ id: z.string(), name, amount: money })), proLaboreTarget: money, emergencyReservePct: rate, updatedAt: z.string().datetime() });
export const simulationSchema = z.object({ id: z.string(), productId: z.string(), quantity: z.number().int().min(1).max(1e7), discountPct: rate, appliedUnitPrice: money, sendToBalance: z.boolean(), simulatedAt: z.string().datetime() });
export const storageSchema = z.object({ version: z.literal(1), productTaxes: z.array(productTaxSchema).default([{ id: 'tax-shopee', name: 'Shopee', ratePct: 0.04 }, { id: 'tax-tiktok', name: 'TikTok Shopping', ratePct: 0.05 }, { id: 'tax-personal', name: 'Venda pessoal', ratePct: 0.01 }]), settings: settingsSchema, products: z.array(productSchema), simulations: z.array(simulationSchema) }).superRefine((s, ctx) => {
  if (new Set(s.productTaxes.map(t => t.id)).size !== s.productTaxes.length) ctx.addIssue({ code: 'custom', message: 'Impostos duplicados.' });
  if (new Set(s.products.map(p => p.id)).size !== s.products.length) ctx.addIssue({ code: 'custom', message: 'Produtos duplicados.' });
  if (s.simulations.some(o => !s.products.some(p => p.id === o.productId))) ctx.addIssue({ code: 'custom', message: 'Pedido sem produto.' });
});
