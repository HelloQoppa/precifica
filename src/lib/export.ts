import Papa from 'papaparse';
import { calculateGoals, calculateProduct, calculateUnits, type calculateBalance } from '../domain/calculations/finance';
import type { CatalogProduct, CompanySettings } from '../types';
import { pct } from './utils';

export function exportCatalog(products: CatalogProduct[], settings: CompanySettings) {
  const goals = calculateGoals(settings);
  const currency = (value: number) => value.toFixed(2).replace('.', ',');
  const rows: (string | number)[][] = [
    ['Produto', 'Custo unitário (R$)', 'Preço sugerido (R$)', 'Preço praticado (R$)', 'Contribuição / un. (R$)', 'Margem', 'Equilíbrio / un.', 'Meta ideal / un.', 'Situação'],
    ...products.map(product => {
      const metrics = calculateProduct(product);
      return [
        product.name,
        currency(metrics.cost),
        currency(metrics.suggested),
        currency(product.practicedPrice),
        currency(metrics.contribution),
        pct(metrics.margin),
        calculateUnits(goals.fixed, metrics.contribution) ?? 'Inviável',
        calculateUnits(goals.ideal, metrics.contribution) ?? 'Inviável',
        metrics.contribution > 0 ? 'Contribui' : 'Em risco',
      ];
    }),
  ];
  downloadCsv(rows, 'catalogo-de-produtos.csv');
}

export async function exportBalance(balance: ReturnType<typeof calculateBalance>, month: string) {
  const rows: (string | number)[][] = [['Balancete projetado', month], ['Produto', 'Quantidade', 'Preço médio', 'Receita', 'Custos variáveis', 'Impostos', 'Contribuição'], ...balance.rows.map(r => [r.name, r.quantity, r.weightedPrice, r.revenue, r.costs, r.taxes, r.contribution]), [], ['Receita total', balance.revenue], ['Custos variáveis', balance.costs], ['Impostos', balance.taxes], ['Contribuição', balance.contribution], ['Custos fixos', balance.goals.fixed], ['Resultado operacional', balance.result], ['Pró-labore e reserva', balance.goals.ideal - balance.goals.fixed], ['Resultado após metas', balance.afterGoals]];
  downloadCsv(rows, `balancete-${month}.csv`);
}

function downloadCsv(rows: (string | number)[][], filename: string) {
  const csv = Papa.unparse(rows, { delimiter: ';', escapeFormulae: true });
  const url = URL.createObjectURL(new Blob(['\uFEFF', csv], { type: 'text/csv;charset=utf-8;' }));
  const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
