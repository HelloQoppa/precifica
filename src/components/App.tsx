"use client";
import { useEffect, useState } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Calculator,
  ChevronRight,
  CircleDollarSign,
  Download,
  LayoutDashboard,
  Package,
  Plus,
  RotateCcw,
  Settings2,
  ShieldCheck,
  Target,
  TrendingUp,
  Wallet,
  Pencil,
  Trash2,
} from "lucide-react";
import { useAppStore } from "../stores/useAppStore";
import {
  calculateBalance,
  calculateGoals,
  calculateProduct,
  calculateUnits,
} from "../domain/calculations/finance";
import { brl, currentMonth, pct } from "../lib/utils";
import { exportCatalog } from "../lib/export";
import type { CatalogProduct } from "../types";
import { Button } from "./ui/button";
import { Modal } from "./ui/dialog";
import { ProductForm } from "./catalog/ProductForm";
import { SettingsForm } from "./SettingsForm";
import { Simulator } from "./simulator/Simulator";
import { Balance } from "./balance/Balance";
const tabs = [
  { name: "Visão geral", icon: LayoutDashboard },
  { name: "Catálogo de produtos", icon: Package },
  { name: "Simulador de pedidos", icon: Calculator },
  { name: "Balancete projetado", icon: BarChart3 },
  { name: "Custos e metas", icon: Settings2 },
];
export function App() {
  const state = useAppStore();
  const [tab, setTab] = useState(0);
  const [month, setMonth] = useState(currentMonth);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<CatalogProduct>();
  const [resetOpen, setResetOpen] = useState(false);
  const [deleting, setDeleting] = useState<CatalogProduct>();
  useEffect(() => {
    void useAppStore.persist.rehydrate();
  }, []);
  if (!state._hasHydrated)
    return (
      <main className="loading">
        <CircleDollarSign size={36} />
        <p>Preparando suas finanças…</p>
      </main>
    );
  const balance = calculateBalance(state, month);
  const goals = calculateGoals(state.settings);
  const coverage =
    goals.ideal > 0
      ? Math.max(0, Math.min(1, balance.contribution / goals.ideal))
      : 1;
  const edit = (p?: CatalogProduct) => {
    setEditing(p);
    setModal(true);
  };
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="/" aria-label="Precifica início">
          <span className="brand-icon">
            <TrendingUp size={24} />
          </span>
          precifica<span className="brand-dot">.</span>
        </a>
        <div className="workspace-label">SEU NEGÓCIO, EM EQUILÍBRIO</div>
        <nav>
          {tabs.map((t, i) => (
            <button
              className={`nav-item ${tab === i ? "active" : ""}`}
              key={t.name}
              onClick={() => setTab(i)}
            >
              <t.icon size={19} />
              {t.name}
              {tab === i && <ChevronRight size={15} className="nav-chevron" />}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="local-card">
            <ShieldCheck size={21} />
            <strong>Seus dados ficam com você</strong>
            <p>Sem conta, sem nuvem. Salvos neste navegador.</p>
          </div>
          <button className="reset-link" onClick={() => setResetOpen(true)}>
            <RotateCcw size={15} /> Restaurar demonstração
          </button>
          <div className="version">PRECIFICA · VERSÃO 0.1</div>
        </div>
      </aside>
      <div className="main-area">
        <header className="topbar">
          <span>
            Meu espaço de trabalho <ChevronRight size={14} />
            <strong>{tabs[tab].name}</strong>
          </span>
          <span className="local-status">
            <span /> Armazenamento local
          </span>
        </header>
        <main className="content">
          <div className="page-heading">
            <div>
              <div className="eyebrow">INTELIGÊNCIA PARA O SEU NEGÓCIO</div>
              <h1>
                {tab === 0 ? "Seu próximo passo é lucrar." : tabs[tab].name}
              </h1>
              <p className="muted">
                {tab === 0
                  ? "Entenda seus números e transforme vendas em um negócio sustentável."
                  : "Decisões conectadas, da formação do preço ao resultado do mês."}
              </p>
            </div>
            <label className="month-label">
              Mês da projeção
              <input
                aria-label="Mês da projeção"
                type="month"
                value={month}
                onChange={(e) => {
                  if (e.target.value) setMonth(e.target.value);
                }}
              />
            </label>
          </div>
          {state.notice && (
            <div className="callout" role="status">
              {state.notice}
            </div>
          )}
          {tab === 0 && (
            <>
              <div className="metrics">
                {[
                  {
                    label: "Faturamento projetado",
                    value: balance.revenue,
                    icon: Wallet,
                    detail: "Receita dos pedidos incluídos",
                  },
                  {
                    label: "Contribuição do mês",
                    value: balance.contribution,
                    icon: CircleDollarSign,
                    detail: "Após insumos, impostos e taxas",
                  },
                  {
                    label: "Meta mensal ideal",
                    value: goals.ideal,
                    icon: Target,
                    detail: "Custos fixos + pró-labore + reserva",
                  },
                  {
                    label: "Resultado operacional",
                    value: balance.result,
                    icon: TrendingUp,
                    detail: "Contribuição menos custos fixos",
                  },
                ].map((m, i) => (
                  <section
                    className={`metric ${i === 3 ? "featured" : ""}`}
                    key={m.label}
                  >
                    <div className="metric-label">
                      {m.label}
                      <m.icon size={19} />
                    </div>
                    <strong>{brl(m.value)}</strong>
                    <small>{m.detail}</small>
                  </section>
                ))}
              </div>
              <div className="overview-grid">
                <section className="panel goal-panel">
                  <div className="section-head">
                    <h2>Como está a sua meta?</h2>
                    <span className="badge">PROJEÇÃO MENSAL</span>
                  </div>
                  <p className="muted">
                    Cada pedido aproxima seu negócio do equilíbrio.
                  </p>
                  <div className="goal-value">
                    <strong>{pct(coverage)}</strong>
                    <span>da meta ideal coberta</span>
                  </div>
                  <div className="progress">
                    <div style={{ width: `${coverage * 100}%` }} />
                  </div>
                  <div className="progress-label">
                    <span>{brl(balance.contribution)} de contribuição</span>
                    <strong>{brl(goals.ideal)}</strong>
                  </div>
                  <div className="goal-breakdown">
                    <div>
                      <span className="legend-dot" />
                      Custos fixos<strong>{brl(goals.fixed)}</strong>
                    </div>
                    <div>
                      <span className="legend-dot second" />
                      Seu pró-labore
                      <strong>{brl(state.settings.proLaboreTarget)}</strong>
                    </div>
                    <div>
                      <span className="legend-dot third" />
                      Reserva operacional<strong>{brl(goals.reserve)}</strong>
                    </div>
                  </div>
                  <div className="callout">
                    <Target size={20} />
                    <span>
                      {balance.afterGoals >= 0 ? (
                        "Sua projeção cobre os custos e as metas planejadas."
                      ) : (
                        <>
                          Faltam <strong>{brl(-balance.afterGoals)}</strong> de
                          contribuição para atingir sua meta.
                        </>
                      )}
                    </span>
                  </div>
                </section>
                <section className="next-step">
                  <div className="step-icon">
                    <Calculator size={26} />
                  </div>
                  <div className="eyebrow">ANTES DE DAR DESCONTO</div>
                  <h2>
                    Pedido grande.
                    <br />
                    Lucro também?
                  </h2>
                  <p>
                    Descubra até onde você pode negociar sem comprometer a saúde
                    do seu negócio.
                  </p>
                  <Button onClick={() => setTab(2)}>
                    Simular um pedido <ArrowUpRight size={17} />
                  </Button>
                  <small>Calcule o impacto antes de fechar negócio.</small>
                </section>
              </div>
              <section className="panel">
                <div className="section-head">
                  <div>
                    <h2>Produtos sob controle</h2>
                    <p className="muted">
                      Uma visão rápida da contribuição de cada venda.
                    </p>
                  </div>
                  <Button variant="ghost" onClick={() => setTab(1)}>
                    Ver catálogo <ChevronRight size={16} />
                  </Button>
                </div>
                <ProductTable
                  products={state.products}
                  onEdit={edit}
                  onDelete={setDeleting}
                  fixed={goals.fixed}
                  ideal={goals.ideal}
                />
              </section>
              <div className="bottom-note">
                <ShieldCheck size={15} /> Projeções para apoiar suas decisões.
                Os resultados dependem dos custos e volumes informados.
              </div>
            </>
          )}
          {tab === 1 && (
            <section className="panel">
              <div className="section-head">
                <div>
                  <h2>Seu catálogo</h2>
                  <p className="muted">Insumos, preços e metas por produto.</p>
                </div>
                <div className="row-actions">
                  <Button
                    variant="outline"
                    disabled={state.products.length === 0}
                    onClick={() => exportCatalog(state.products, state.settings)}
                  >
                    <Download size={16} /> Exportar CSV
                  </Button>
                  <Button onClick={() => edit()}>
                    <Plus size={16} /> Novo produto
                  </Button>
                </div>
              </div>
              <ProductTable
                products={state.products}
                onEdit={edit}
                onDelete={setDeleting}
                fixed={goals.fixed}
                ideal={goals.ideal}
                detailed
              />
            </section>
          )}
          {tab === 2 && <Simulator />}
          {tab === 3 && <Balance month={month} />}
          {tab === 4 && <SettingsForm key={state.settings.updatedAt} />}
        </main>
      </div>
      <Modal
        title={editing ? "Editar produto" : "Novo produto"}
        open={modal}
        onOpenChange={setModal}
      >
        {modal && (
          <ProductForm
            key={editing?.id ?? "new"}
            product={editing}
            onDone={() => setModal(false)}
          />
        )}
      </Modal>
      <Modal
        title="Restaurar dados de exemplo?"
        open={resetOpen}
        onOpenChange={setResetOpen}
      >
        <p>
          Seus produtos, custos e pedidos atuais serão substituídos pelo
          conjunto de demonstração.
        </p>
        <Button
          variant="destructive"
          onClick={() => {
            state.reset();
            setResetOpen(false);
          }}
        >
          Restaurar demonstração
        </Button>
      </Modal>
      <Modal
        title="Excluir produto?"
        open={!!deleting}
        onOpenChange={(open) => {
          if (!open) setDeleting(undefined);
        }}
      >
        <p>
          Excluir “{deleting?.name}” também remove os pedidos simulados desse
          produto.
        </p>
        <Button
          variant="destructive"
          onClick={() => {
            if (deleting) state.deleteProduct(deleting.id);
            setDeleting(undefined);
          }}
        >
          Excluir produto e pedidos
        </Button>
      </Modal>
    </div>
  );
}
function ProductTable({
  products,
  onEdit,
  onDelete,
  fixed,
  ideal,
  detailed = false,
}: {
  products: CatalogProduct[];
  onEdit: (p: CatalogProduct) => void;
  onDelete: (p: CatalogProduct) => void;
  fixed: number;
  ideal: number;
  detailed?: boolean;
}) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Produto</th>
            {detailed && (
              <>
                <th>Custo unitário</th>
                <th>Preço sugerido</th>
              </>
            )}
            <th>Preço praticado</th>
            <th>Contribuição / un.</th>
            <th>Margem</th>
            {detailed && (
              <>
                <th>Equilíbrio / un.</th>
                <th>Meta ideal / un.</th>
              </>
            )}
            <th>Situação</th>
            <th>
              <span className="sr-only">Ações</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {products.map((p) => {
            const m = calculateProduct(p);
            return (
              <tr key={p.id}>
                <td>
                  <div className="product-cell">
                    <span className="product-icon">
                      <Package size={18} />
                    </span>
                    <span>
                      <strong>{p.name}</strong>
                      <small>
                        {p.ingredients.length} insumos na ficha técnica
                      </small>
                    </span>
                  </div>
                </td>
                {detailed && (
                  <>
                    <td>{brl(m.cost)}</td>
                    <td>{brl(m.suggested)}</td>
                  </>
                )}
                <td>{brl(p.practicedPrice)}</td>
                <td className={m.contribution > 0 ? "positive" : "negative"}>
                  {brl(m.contribution)}
                </td>
                <td>{pct(m.margin)}</td>
                {detailed && (
                  <>
                    <td>
                      {calculateUnits(fixed, m.contribution) ?? "Inviável"}
                    </td>
                    <td>
                      {calculateUnits(ideal, m.contribution) ?? "Inviável"}
                    </td>
                  </>
                )}
                <td>
                  <span
                    className={`status-pill ${m.contribution <= 0 ? "bad" : ""}`}
                  >
                    {m.contribution > 0 ? (
                      <ArrowUpRight size={13} />
                    ) : (
                      <ArrowDownRight size={13} />
                    )}
                    {m.contribution > 0 ? "Contribui" : "Em risco"}
                  </span>
                </td>
                <td>
                  <div className="row-actions">
                    <button
                      className="icon-button"
                      aria-label={`Editar ${p.name}`}
                      onClick={() => onEdit(p)}
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      className="icon-button"
                      aria-label={`Excluir ${p.name}`}
                      onClick={() => onDelete(p)}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {products.length === 0 && (
        <p className="empty">
          Seu catálogo está vazio. Adicione seu primeiro produto.
        </p>
      )}
    </div>
  );
}
