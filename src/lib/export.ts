import Papa from 'papaparse';
import type { calculateBalance } from '../domain/calculations/finance';
export async function exportBalance(balance: ReturnType<typeof calculateBalance>, month: string) {
  const rows: (string | number)[][] = [['Balancete projetado', month], ['Produto', 'Quantidade', 'Preço médio', 'Receita', 'Custos variáveis', 'Impostos', 'Contribuição'], ...balance.rows.map(r => [r.name, r.quantity, r.weightedPrice, r.revenue, r.costs, r.taxes, r.contribution]), [], ['Receita total', balance.revenue], ['Custos variáveis', balance.costs], ['Impostos', balance.taxes], ['Contribuição', balance.contribution], ['Custos fixos', balance.goals.fixed], ['Resultado operacional', balance.result], ['Pró-labore e reserva', balance.goals.ideal - balance.goals.fixed], ['Resultado após metas', balance.afterGoals]];
  const csv = Papa.unparse(rows, { delimiter: ';', escapeFormulae: true });
  const url = URL.createObjectURL(new Blob(['\uFEFF', csv], { type: 'text/csv;charset=utf-8;' }));
  const a = document.createElement('a'); a.href = url; a.download = `balancete-${month}.csv`; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
