"use client";
import { Download, Trash2 } from "lucide-react";
import { useAppStore } from "../../stores/useAppStore";
import { calculateBalance } from "../../domain/calculations/finance";
import { brl, pct } from "../../lib/utils";
import { exportBalance } from "../../lib/export";
import { simulationMonth } from "../../lib/dates";
import { Button } from "../ui/button";
export function Balance({ month }: { month: string }) {
  const state = useAppStore();
  const balance = calculateBalance(state, month);
  return (
    <div className="form-stack">
      <div className="panel">
        <div className="section-head">
          <div>
            <h2>Balancete projetado</h2>
            <br />
            <p className="muted">
              Somente pedidos marcados para este mês. Não representa vendas
              realizadas.
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => void exportBalance(balance, month)}
          >
            <Download size={16} /> Exportar CSV
          </Button>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Produto</th>
                <th>Unidades</th>
                <th>Preço médio</th>
                <th>Receita</th>
                <th>Insumos</th>
                <th>Taxas</th>
                <th>Contribuição</th>
              </tr>
            </thead>
            <tbody>
              {balance.rows.map((r) => (
                <tr key={r.id}>
                  <td>{r.name}</td>
                  <td>{r.quantity}</td>
                  <td>{brl(r.weightedPrice)}</td>
                  <td>{brl(r.revenue)}</td>
                  <td>{brl(r.costs)}</td>
                  <td>{brl(r.taxes)}</td>
                  <td>{brl(r.contribution)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!balance.rows.length && (
            <p className="empty">
              Nenhum pedido incluído neste mês. Salve uma simulação para
              começar.
            </p>
          )}
        </div>
        <div className="balance-summary">
          {[
            ["Contribuição total", balance.contribution],
            ["Custos fixos", -balance.goals.fixed],
            ["Resultado operacional", balance.result],
            ["Pró-labore planejado", -state.settings.proLaboreTarget],
            ["Reserva planejada", -balance.goals.reserve],
            ["Resultado após metas", balance.afterGoals],
          ].map(([label, value]) => (
            <div className="detail-row" key={label}>
              <span>{label}</span>
              <strong className={Number(value) < 0 ? "negative" : "positive"}>
                {brl(Number(value))}
              </strong>
            </div>
          ))}
        </div>
      </div>
      <div className="panel">
        <h2>Pedidos simulados</h2>
        <br />
        <p className="muted">Selecione quais pedidos entram na projeção.</p>
        {state.simulations
          .filter((s) => simulationMonth(s.simulatedAt) === month)
          .map((s) => (
            <div className="order-row" key={s.id}>
              <label className="checkbox">
                <input
                  type="checkbox"
                  checked={s.sendToBalance}
                  onChange={() => state.toggleSimulation(s.id)}
                />
                <span>
                  <strong>
                    {state.products.find((p) => p.id === s.productId)?.name}
                  </strong>
                  <small>
                    {s.quantity} unidades · {pct(s.discountPct)} de desconto ·{" "}
                    {brl(s.appliedUnitPrice)} / un.
                  </small>
                </span>
              </label>
              <Button
                variant="ghost"
                aria-label="Excluir pedido"
                onClick={() => state.deleteSimulation(s.id)}
              >
                <Trash2 size={16} />
              </Button>
            </div>
          ))}
        <p className="footnote">
          Preços negociados são preservados. Custos e alíquotas usam o cadastro
          atual do produto.
        </p>
      </div>
    </div>
  );
}
